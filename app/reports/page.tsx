import Link from 'next/link';
import { NewBadge } from '../_NewBadge';
import { REPORTS } from '@/lib/reports/registry';

export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Reports</h1>
        <p className="mt-1 text-muted">
          One report per data set — filter by date range and the fields that matter, then
          download as CSV, Excel, or PDF.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Link key={r.slug} href={`/reports/${r.slug}`} className="fh-card fh-card--interactive block">
            <div className="flex items-center justify-between">
              <h2 className="fh-card__title text-foreground">{r.title}</h2>
              <NewBadge />
            </div>
            <p className="mt-2 text-sm text-muted">{r.description}</p>
            <span className="mt-3 inline-block text-sm font-medium text-primary">Open →</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
