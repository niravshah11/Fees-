import Link from 'next/link';
import { prisma } from '@/lib/db';
import { tileToneClass } from '@/lib/tile-tone';

export const dynamic = 'force-dynamic';

export default async function MasterIndex() {
  const schools = await prisma.school.findMany({
    orderBy: { order: 'asc' },
    include: {
      programmeStages: { include: { gradeBands: true } },
      feeVersions: {
        where: { status: { not: 'SUPERSEDED' } },
        orderBy: [{ academicYear: 'desc' }, { createdAt: 'desc' }],
        take: 1,
        select: { status: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Master data</h1>
        <p className="mt-1 text-muted">
          Every campus has its own programme stages and grade bands, each with its own YoY
          increment policy. Open a school to add, edit, or remove them.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => {
          const bandCount = school.programmeStages.reduce((n, s) => n + s.gradeBands.length, 0);
          return (
            <Link key={school.id} href={`/master/${school.code}`} className={`fh-card fh-card--interactive block ${tileToneClass(school.feeVersions[0]?.status)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="fh-card__title text-foreground">{school.code}</div>
                  <div className="text-sm text-muted">{school.name}</div>
                </div>
                <span className="fh-badge">{school.board}</span>
              </div>
              <div className="mt-4 text-sm text-muted">
                {school.programmeStages.length} programme stage{school.programmeStages.length === 1 ? '' : 's'} · {bandCount} grade band{bandCount === 1 ? '' : 's'}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
