import { NextResponse } from 'next/server';
import { getReportDefinition } from '@/lib/reports/registry';
import { rowsToCsv, rowsToXlsxBuffer, rowsToPdfBuffer } from '@/lib/reports/export';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const report = getReportDefinition(slug);
  if (!report) return NextResponse.json({ error: 'Unknown report' }, { status: 404 });

  const url = new URL(req.url);
  const format = url.searchParams.get('format') ?? 'csv';
  const filters: Record<string, string | undefined> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key === 'format') continue;
    if (value) filters[key] = value;
  }

  const rows = await report.getRows(filters);
  const safeName = report.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();

  if (format === 'xlsx') {
    const buffer = await rowsToXlsxBuffer(report.columns, rows, report.title);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${safeName}.xlsx"`,
      },
    });
  }

  if (format === 'pdf') {
    const buffer = await rowsToPdfBuffer(report.columns, rows, report.title);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}.pdf"`,
      },
    });
  }

  const csv = rowsToCsv(report.columns, rows);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeName}.csv"`,
    },
  });
}
