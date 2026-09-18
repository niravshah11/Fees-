import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const inrCompact = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 });

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'fh-badge--neutral',
  PENDING_APPROVAL: 'fh-badge--warning',
  APPROVED: 'fh-badge--success',
  REJECTED: 'fh-badge--danger',
  SUPERSEDED: 'fh-badge--neutral',
};

export default async function Dashboard() {
  const schools = await prisma.school.findMany({
    orderBy: { order: 'asc' },
    include: {
      feeVersions: {
        where: { status: { not: 'SUPERSEDED' } },
        orderBy: [{ academicYear: 'desc' }, { createdAt: 'desc' }],
        include: { feeLines: true },
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
        <div className="fh-stat items-center text-center">
          <span className="fh-stat__label">Schools</span>
          <span className="fh-stat__value">{schools.length}</span>
        </div>
        <div className="fh-stat fh-stat--success items-center text-center">
          <span className="fh-stat__label">Approved fee</span>
          <span className="fh-stat__value">{approvedCount}</span>
        </div>
        <div className="fh-stat fh-stat--warning items-center text-center">
          <span className="fh-stat__label">In review</span>
          <span className="fh-stat__value">{pendingCount}</span>
        </div>
        <div className="fh-stat items-center text-center">
          <span className="fh-stat__label">Draft / not started</span>
          <span className="fh-stat__value">{draftCount}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => {
          const approved = school.feeVersions.find((v) => v.status === 'APPROVED');
          const latest = school.feeVersions[0];
          const latestIsDraftish = latest && latest.status !== 'APPROVED';
          const tuitionRange = approved
            ? [Math.min(...approved.feeLines.map((l) => l.tuitionFee)), Math.max(...approved.feeLines.map((l) => l.tuitionFee))]
            : null;

          return (
            <Link key={school.id} href={`/schools/${school.code}`} className="fh-card block transition-shadow hover:shadow-fh-md">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-heading text-lg font-bold text-foreground">{school.code}</div>
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
                        <span className="text-muted">Tuition range</span>
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
