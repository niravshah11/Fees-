import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentRights } from '@/lib/auth/rights';
import { canDraftForCampus } from '@/engine/rights';
import { STANDARD_GRADES } from '@/lib/grades';
import {
  createProgrammeStage,
  updateProgrammeStage,
  deleteProgrammeStage,
  createGradeBands,
  updateGradeBand,
  deleteGradeBand,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function MasterSchool({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const school = await prisma.school.findUnique({
    where: { code },
    include: {
      programmeStages: {
        orderBy: { order: 'asc' },
        include: { gradeBands: { orderBy: { order: 'asc' }, include: { _count: { select: { feeLines: true } } } } },
      },
    },
  });
  if (!school) notFound();

  const grants = await getCurrentRights();
  const canEdit = canDraftForCampus(grants, school.code);
  const usedGrades = new Set(school.programmeStages.flatMap((s) => s.gradeBands.map((b) => b.label)));
  const availableGrades = STANDARD_GRADES.filter((g) => !usedGrades.has(g));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/master" className="text-sm text-primary hover:underline">← Master data</Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-foreground">{school.code}</h1>
          <span className="fh-badge">{school.board}</span>
        </div>
        <p className="text-muted">{school.name}</p>
        <p className="mt-1 text-sm text-muted">
          Just structure here — which grades belong to which programme. YoY increment % is set
          fresh each year in that school's Fee Builder, not stored as a default.
        </p>
        {!canEdit && (
          <p className="fh-alert fh-alert--warning mt-3 text-sm">
            You don't hold Finance Officer rights for {school.code} — this page is read-only for you.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {school.programmeStages.map((stage) => (
          <section key={stage.id} className="fh-card">
            {canEdit ? (
              <form action={updateProgrammeStage.bind(null, school.code, stage.id)} className="flex flex-wrap items-end gap-2">
                <div className="flex-1">
                  <label className="fh-label text-xs">Programme / stage label</label>
                  <input name="label" defaultValue={stage.label} className="fh-input" required />
                </div>
                <button type="submit" className="fh-btn fh-btn--secondary">Save</button>
                <form action={deleteProgrammeStage.bind(null, school.code, stage.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">Remove stage</button>
                </form>
              </form>
            ) : (
              <div className="font-heading font-bold text-foreground">{stage.label}</div>
            )}

            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {stage.gradeBands.map((band) => (
                <div key={band.id} className="flex flex-wrap items-end gap-2 rounded-md bg-surface-sunken p-2">
                  {canEdit ? (
                    <form action={updateGradeBand.bind(null, school.code, band.id)} className="flex flex-wrap items-end gap-2">
                      <input name="label" defaultValue={band.label} className="fh-input" required />
                      <select name="programmeStageId" defaultValue={stage.id} className="fh-input">
                        {school.programmeStages.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                      <button type="submit" className="fh-btn fh-btn--secondary fh-btn--sm">Save</button>
                    </form>
                  ) : (
                    <span className="fh-badge fh-badge--neutral">{band.label}</span>
                  )}
                  {canEdit && (
                    <form action={deleteGradeBand.bind(null, school.code, band.id)} className="ml-auto">
                      <button
                        type="submit"
                        className="text-xs text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
                        disabled={band._count.feeLines > 0}
                        title={band._count.feeLines > 0 ? `Has ${band._count.feeLines} fee line(s) recorded — cannot remove` : undefined}
                      >
                        Remove
                      </button>
                    </form>
                  )}
                </div>
              ))}
              {stage.gradeBands.length === 0 && <p className="text-sm text-muted">No grade bands under this stage yet.</p>}

              {canEdit && availableGrades.length > 0 && (
                <form action={createGradeBands.bind(null, school.code, stage.id)} className="flex flex-wrap items-end gap-2 pt-2">
                  <div>
                    <label className="fh-label text-xs">Add grades to {stage.label} (ctrl/cmd-click for several)</label>
                    <select name="grades" multiple size={Math.min(6, availableGrades.length)} className="fh-input">
                      {availableGrades.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="fh-btn fh-btn--secondary fh-btn--sm">Add selected grades</button>
                </form>
              )}
            </div>
          </section>
        ))}

        {school.programmeStages.length === 0 && (
          <div className="fh-card text-sm text-muted">No programme stages yet — add one below.</div>
        )}
      </div>

      {canEdit && (
        <section className="fh-card">
          <h2 className="font-heading text-lg font-bold text-foreground">Add a new programme stage</h2>
          <form action={createProgrammeStage.bind(null, school.code)} className="mt-3 flex flex-wrap items-end gap-2">
            <div className="flex-1">
              <label className="fh-label text-xs">Programme / stage label</label>
              <input name="label" placeholder="e.g. MYP — Middle Years Programme" className="fh-input" required />
            </div>
            <button type="submit" className="fh-btn fh-btn--primary">Add stage</button>
          </form>
        </section>
      )}
    </div>
  );
}
