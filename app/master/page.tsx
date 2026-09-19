import Link from 'next/link';
import { prisma } from '@/lib/db';
import { tileToneClass } from '@/lib/tile-tone';
import { getCurrentUser } from '@/lib/auth/session';
import { resolveRightsAdmins, isRightsAdmin } from '@/lib/auth/rights-admins';
import { createSchool, updateSchool, deleteSchool } from './actions';
import { ConfirmDeleteSchool } from './_ConfirmDeleteSchool';

export const dynamic = 'force-dynamic';

export default async function MasterIndex() {
  const user = await getCurrentUser();
  const admins = resolveRightsAdmins(process.env.RIGHTS_ADMIN_EMAILS);
  const isAdmin = user ? isRightsAdmin(user.email, admins) : process.env.NODE_ENV !== 'production';

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
      _count: { select: { programmeStages: true, gradeBands: true, feeHeads: true, feeVersions: true, feePolicies: true } },
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
          const hasData = Object.values(school._count).some((n) => n > 0);
          return (
            <div key={school.id} className={`fh-card fh-card--interactive ${tileToneClass(school.feeVersions[0]?.status)}`}>
              <Link href={`/master/${school.code}`} className="block">
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

              {isAdmin && (
                <details className="mt-3 border-t border-border pt-3">
                  <summary className="cursor-pointer text-xs text-primary hover:underline">Edit campus details</summary>
                  <form action={updateSchool.bind(null, school.code)} className="mt-2 space-y-2">
                    <div>
                      <label className="fh-label text-xs">Name</label>
                      <input name="name" defaultValue={school.name} className="fh-input fh-input--sm w-full" required />
                    </div>
                    <div>
                      <label className="fh-label text-xs">Board</label>
                      <input name="board" defaultValue={school.board} className="fh-input fh-input--sm w-full" required />
                    </div>
                    <div>
                      <label className="fh-label text-xs">Staff email domain</label>
                      <input name="domain" defaultValue={school.domain} className="fh-input fh-input--sm w-full" />
                    </div>
                    <button type="submit" className="fh-btn fh-btn--outline fh-btn--sm">Save</button>
                  </form>
                  <div className="mt-2">
                    <ConfirmDeleteSchool
                      action={deleteSchool.bind(null, school.code)}
                      code={school.code}
                      name={school.name}
                      disabled={hasData}
                      disabledReason="Has programme stages, grade bands, fee heads, fee versions, or policies — cannot remove"
                    />
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <section className="fh-card fh-card--accent-top">
          <h2 className="fh-card__title text-foreground">Add a new campus</h2>
          <form action={createSchool} className="mt-3 grid gap-3 sm:grid-cols-4">
            <div>
              <label className="fh-label text-xs">Code</label>
              <input name="code" placeholder="e.g. FNEW" maxLength={10} className="fh-input" required />
            </div>
            <div className="sm:col-span-2">
              <label className="fh-label text-xs">Name</label>
              <input name="name" placeholder="Fountainhead ..." className="fh-input" required />
            </div>
            <div>
              <label className="fh-label text-xs">Board</label>
              <input name="board" placeholder="IB" className="fh-input" required />
            </div>
            <div className="sm:col-span-3">
              <label className="fh-label text-xs">Staff email domain (optional)</label>
              <input name="domain" placeholder="e.g. fnew.in" className="fh-input" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="fh-btn fh-btn--primary w-full">Add campus</button>
            </div>
          </form>
          <p className="mt-2 text-xs text-muted">
            The code becomes this campus's URL and can't be changed later. Set up its programme
            stages, grade bands, and fee heads on its own Master data page once it's created.
          </p>
        </section>
      )}
    </div>
  );
}
