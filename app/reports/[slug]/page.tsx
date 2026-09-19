import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getReportDefinition } from '@/lib/reports/registry';
import { formatCell } from '@/lib/reports/types';

export const dynamic = 'force-dynamic';

const PREVIEW_LIMIT = 25;

function toFilterRecord(searchParams: Record<string, string | string[] | undefined>): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v) record[key] = v;
  }
  return record;
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const report = getReportDefinition(slug);
  if (!report) notFound();

  const rawFilters = await searchParams;
  const filters = toFilterRecord(rawFilters);
  const [rows, filterFields] = await Promise.all([report.getRows(filters), report.filterFields()]);
  const query = new URLSearchParams(filters).toString();
  const withFormat = (format: string) => `/api/reports/${slug}?format=${format}${query ? `&${query}` : ''}`;

  return (
    <div className="space-y-6">
      <Link href="/reports" className="text-sm text-primary hover:underline">← Reports</Link>

      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{report.title}</h1>
        <p className="mt-1 text-muted">{report.description}</p>
      </div>

      <form method="get" className="fh-card flex flex-wrap items-end gap-3">
        {filterFields.map((field) =>
          field.type === 'daterange' ? (
            <div key="daterange" className="flex items-end gap-2">
              <div>
                <label className="fh-label text-xs">{field.dateLabel} — from</label>
                <input type="date" name="from" defaultValue={filters.from ?? ''} className="fh-input" />
              </div>
              <div>
                <label className="fh-label text-xs">to</label>
                <input type="date" name="to" defaultValue={filters.to ?? ''} className="fh-input" />
              </div>
            </div>
          ) : (
            <div key={field.key}>
              <label className="fh-label text-xs">{field.label}</label>
              <select name={field.key} defaultValue={filters[field.key] ?? ''} className="fh-input">
                <option value="">All</option>
                {field.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ),
        )}
        <button type="submit" className="fh-btn fh-btn--primary">Apply filters</button>
        {query && (
          <Link href={`/reports/${slug}`} className="text-sm text-muted hover:underline">
            Clear filters
          </Link>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <a href={withFormat('csv')} className="fh-btn fh-btn--outline fh-btn--sm">Download CSV</a>
        <a href={withFormat('xlsx')} className="fh-btn fh-btn--outline fh-btn--sm">Download Excel</a>
        <a href={withFormat('pdf')} className="fh-btn fh-btn--outline fh-btn--sm">Download PDF</a>
      </div>

      <div className="fh-card">
        <p className="mb-3 text-sm text-muted">
          {rows.length} row{rows.length === 1 ? '' : 's'} {rows.length === 1 ? 'matches' : 'match'} these filters
          {rows.length > PREVIEW_LIMIT ? ` — showing the first ${PREVIEW_LIMIT}` : ''}.
        </p>
        <div className="overflow-x-auto">
          <table className="fh-table fh-table--striped">
            <thead>
              <tr>
                {report.columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, PREVIEW_LIMIT).map((row, i) => (
                <tr key={i}>
                  {report.columns.map((c) => (
                    <td key={c.key}>{formatCell(c.get(row))}</td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={report.columns.length} className="py-6 text-center text-muted">
                    No rows match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
