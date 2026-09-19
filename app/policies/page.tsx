import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function PoliciesIndex() {
  const schools = await prisma.school.findMany({
    orderBy: { order: 'asc' },
    include: {
      feePolicies: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { feePolicies: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Fee policies</h1>
        <p className="mt-1 text-muted">
          Every campus keeps its own fee-policy document — a PDF, updated independently of the
          fee figures themselves. Open a school to view its current policy or upload a new one.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => {
          const current = school.feePolicies[0];
          return (
            <Link key={school.id} href={`/policies/${school.code}`} className="fh-card block transition-shadow hover:shadow-fh-md">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-heading text-lg font-bold text-foreground">{school.code}</div>
                  <div className="text-sm text-muted">{school.name}</div>
                </div>
                <span className="fh-badge">{school.board}</span>
              </div>
              <div className="mt-4 text-sm">
                {current ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Current policy</span>
                    <span className="font-medium text-foreground">{current.academicYear}</span>
                  </div>
                ) : (
                  <div className="text-muted">No policy uploaded yet</div>
                )}
                {school._count.feePolicies > 1 && (
                  <div className="mt-1 text-xs text-muted">{school._count.feePolicies} versions on file</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
