// Turns any report's [columns, rows] into a downloadable file. Three formats, one shared column
// list per report — CSV is hand-rolled; XLSX and PDF use exceljs/pdfkit (pure JS, no native/
// headless-browser dependency, so they run fine on Railway). Ported verbatim from the
// event-management app's lib/reports/export.ts (same estate, same convention).

import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { formatCell, type ReportColumn } from './types';

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function rowsToCsv<T>(columns: ReportColumn<T>[], rows: T[]): string {
  const lines = [columns.map((c) => csvEscape(c.label)).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => csvEscape(formatCell(c.get(row)))).join(','));
  }
  return lines.join('\r\n');
}

export async function rowsToXlsxBuffer<T>(
  columns: ReportColumn<T>[],
  rows: T[],
  sheetName: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31)); // Excel's own sheet-name limit
  sheet.columns = columns.map((c) => ({ header: c.label, key: c.key, width: Math.max(12, c.label.length + 2) }));
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    sheet.addRow(Object.fromEntries(columns.map((c) => [c.key, formatCell(c.get(row))])));
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

const PDF_MARGIN = 30;
const PDF_ROW_MIN_HEIGHT = 16;
const PDF_ROW_PADDING = 6;
const PDF_FONT_SIZE = 8;

/** pdfkit's built-in fonts (Helvetica etc.) only cover WinAnsi/Latin-1 — ₹ renders as a garbled
 *  glyph rather than embedding a whole Unicode font just for one symbol used only in a couple of
 *  column headers. CSV/XLSX don't have this problem (both are plain UTF-8), so this substitution
 *  is PDF-only. */
function sanitizeForPdf(text: string): string {
  return text.replace(/₹/g, 'Rs.');
}

export function rowsToPdfBuffer<T>(columns: ReportColumn<T>[], rows: T[], title: string): Promise<Buffer> {
  const doc = new PDFDocument({ layout: 'landscape', margin: PDF_MARGIN, size: 'A4' });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const pageWidth = doc.page.width - PDF_MARGIN * 2;
  const colWidth = pageWidth / columns.length;
  const textWidth = colWidth - 4;

  // pdfkit wraps text within `width` but does not report or reserve the extra vertical space a
  // wrapped cell needs — every column in a row must be measured first so the row can advance by
  // its tallest cell, otherwise a wrapped cell's later lines overlap the row drawn after it.
  function rowHeight(texts: string[]): number {
    const tallest = Math.max(...texts.map((t) => doc.heightOfString(t, { width: textWidth })));
    return Math.max(PDF_ROW_MIN_HEIGHT, tallest) + PDF_ROW_PADDING;
  }

  function drawRow(texts: string[], y: number, bold: boolean): void {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(PDF_FONT_SIZE);
    texts.forEach((text, i) => {
      doc.text(text, PDF_MARGIN + i * colWidth, y, { width: textWidth });
    });
  }

  const headerTexts = columns.map((c) => sanitizeForPdf(c.label));

  function drawHeaderRow(y: number): number {
    drawRow(headerTexts, y, true);
    const height = rowHeight(headerTexts);
    const lineY = y + height;
    doc.moveTo(PDF_MARGIN, lineY - 3).lineTo(PDF_MARGIN + pageWidth, lineY - 3).strokeColor('#cccccc').stroke();
    return lineY;
  }

  doc.fontSize(14).text(title, PDF_MARGIN, PDF_MARGIN);
  doc.moveDown();
  let y = drawHeaderRow(doc.y + 4);

  const pageBottom = doc.page.height - PDF_MARGIN;
  for (const row of rows) {
    const texts = columns.map((c) => sanitizeForPdf(formatCell(c.get(row))));
    const height = rowHeight(texts);
    if (y + height > pageBottom) {
      doc.addPage();
      y = drawHeaderRow(PDF_MARGIN);
    }
    drawRow(texts, y, false);
    y += height;
  }

  if (rows.length === 0) {
    doc.fontSize(10).fillColor('#888888').text('No rows match these filters.', PDF_MARGIN, y + 6);
  }

  doc.end();
  return done;
}
