import Link from 'next/link';
import type { ReactNode } from 'react';
import { prisma } from '@/lib/db';
import { computeGradeBandTotal } from '@/engine/fee';

export const dynamic = 'force-dynamic';

const inrCompact = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 });

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'fh-badge--neutral',
  PENDING_APPROVAL: 'fh-badge--warning',
  APPROVED: 'fh-badge--success',
  REJECTED: 'fh-badge--danger',
  SUPERSEDED: 'fh-badge--neutral',
};

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone?: 'success' | 'warning';
  icon: ReactNode;
}) {
  const toneClass = tone === 'success' ? 'fh-stat--success' : tone === 'warning' ? 'fh-stat--warning' : '';
  const iconToneClass =
    tone === 'success' ? 'bg-success-subtle text-success' : tone === 'warning' ? 'bg-warning-subtle text-warning' : 'bg-primary-subtle text-primary';

  return (
    <div className={`fh-stat ${toneClass}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconToneClass}`} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            {icon}
          </svg>
        </span>
        <div>
          <span className="fh-stat__label block">{label}</span>
          <span className="fh-stat__value">{value}</span>
        </div>
      </div>
    </div>
  );
}

export default async function Dashboard() {
  const schools = await prisma.school.findMany({
    orderBy: { order: 'asc' },
    include: {
      feeVersions: {
        where: { status: { not: 'SUPERSEDED' } },
        orderBy: [{ academicYear: 'desc' }, { createdAt: 'desc' }],
        include: { feeLines: { include: { feeHead: { select: { isTotal: true } } } } },
      },
    },
  });

  const approvedCount = schools.filter((s) => s.feeVersions.some((v) => v.status === 'APPROVED')).length;
  const pendingCount = schools.filter((s) => s.feeVersions[0]?.status === 'PENDING_APPROVAL').length;
  const draftCount = schools.filter((s) => s.feeVersions[0]?.status === 'DRAFT').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Schools</h1>
        <p className="mt-1 text-muted">
          Open a school to review its grade bands, draft a fee proposal, and track it through the
          Fees Group Coordinator → Head of Operations → Director → Board of Trustees chain.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Schools"
          value={schools.length}
          icon={<><path d="M5 21V7l7-4 7 4v14" /><path d="M3 21h18" /><path d="M9 21v-4a3 3 0 0 1 6 0v4" /></>}
        />
        <StatCard
          label="Approved fee"
          value={approvedCount}
          tone="success"
          icon={<><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>}
        />
        <StatCard
          label="In review"
          value={pendingCount}
          tone="warning"
          icon={<><circle cx="12" cy="12" r="10" /><path d="M12 7v5l3 3" /></>}
        />
        <StatCard
          label="Draft / not started"
          value={draftCount}
          icon={<><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></>}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => {
          const approved = school.feeVersions.find((v) => v.status === 'APPROVED');
          const latest = school.feeVersions[0];
          const latestIsDraftish = latest && latest.status !== 'APPROVED';
          const bandTotals = approved
            ? [...approved.feeLines.reduce((byBand, l) => {
                byBand.set(l.gradeBandId, [...(byBand.get(l.gradeBandId) ?? []), l]);
                return byBand;
              }, new Map<string, typeof approved.feeLines>()).values()].map(computeGradeBandTotal)
            : [];
          const tuitionRange = bandTotals.length > 0 ? [Math.min(...bandTotals), Math.max(...bandTotals)] : null;

          return (
            <Link key={school.id} href={`/schools/${school.code}`} className="fh-card fh-card--interactive block">
              <div className="flex items-start justify-between">
                <div>
                  <div className="fh-card__title text-foreground">{school.code}</div>
                  <div className="text-sm text-muted">{school.name}</div>
                </div>
                <span className="fh-badge">{school.board}</span>
              </div>

              <div className="mt-4 space-y-1.5 text-sm">
                {approved ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Approved</span>
                      <span className="font-medium text-foreground">{approved.academicYear}</span>
                    </div>
                    {tuitionRange && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted">Fee range</span>
                        <span className="font-medium text-foreground">
                          {inrCompact.format(tuitionRange[0])} – {inrCompact.format(tuitionRange[1])}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-muted">No approved fee yet</div>
                )}
                {latestIsDraftish && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted">{latest.academicYear} proposal</span>
                    <span className={`fh-badge ${STATUS_BADGE[latest.status] ?? ''}`}>
                      {latest.status.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
