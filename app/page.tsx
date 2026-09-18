import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Schools</h1>
        <p className="mt-1 text-muted">
          Open a school to review its grade bands, draft a fee proposal, and track it through
          Group Finance and Board of Trustees approval.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => {
          const approved = school.feeVersions.find((v) => v.status === 'APPROVED');
          const latest = school.feeVersions[0];
          const latestIsDraftish = latest && latest.status !== 'APPROVED';

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
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Approved</span>
                    <span className="font-medium text-foreground">{approved.academicYear}</span>
                  </div>
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
