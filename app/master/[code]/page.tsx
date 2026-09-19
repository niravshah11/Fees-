import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { STANDARD_GRADES } from '@/lib/grades';
import { Tabs } from '@/app/_Tabs';
import {
  createProgrammeStage,
  updateProgrammeStage,
  deleteProgrammeStage,
  createGradeBands,
  updateGradeBand,
  deleteGradeBand,
  createFeeHead,
  updateFeeHead,
  deleteFeeHead,
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
      feeHeads: { orderBy: { order: 'asc' }, include: { _count: { select: { feeLines: true } } } },
    },
  });
  if (!school) notFound();

  // Editing Master data is open to every signed-in colleague — there is no dedicated "editor"
  // role (confirmed with the user); only the approval chain itself is role-gated.
  const canEdit = true;
  const usedGrades = new Set(school.programmeStages.flatMap((s) => s.gradeBands.map((b) => b.label)));
  const availableGrades = STANDARD_GRADES.filter((g) => !usedGrades.has(g));

  const programmeContent = (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Which grades belong to which programme. YoY increment % is set fresh each year in that
        school's Fee Builder, not stored as a default.
      </p>

      {school.programmeStages.map((stage) => (
        <section key={stage.id} className="fh-card">
          {canEdit ? (
            <div className="flex flex-wrap items-end gap-2">
              <form action={updateProgrammeStage.bind(null, school.code, stage.id)} className="flex flex-1 flex-wrap items-end gap-2">
                <div className="flex-1">
                  <label className="fh-label text-xs">Programme / stage label</label>
                  <input name="label" defaultValue={stage.label} className="fh-input" required />
                </div>
                <button type="submit" className="fh-btn fh-btn--outline">Save</button>
              </form>
              <form action={deleteProgrammeStage.bind(null, school.code, stage.id)}>
                <button type="submit" className="text-xs text-red-600 hover:underline">Remove stage</button>
              </form>
            </div>
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
                    <button type="submit" className="fh-btn fh-btn--outline fh-btn--sm">Save</button>
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
                <button type="submit" className="fh-btn fh-btn--outline fh-btn--sm">Add selected grades</button>
              </form>
            )}
          </div>
        </section>
      ))}

      {school.programmeStages.length === 0 && (
        <div className="fh-card text-sm text-muted">No programme stages yet — add one below.</div>
      )}

      {canEdit && (
        <section className="fh-card">
          <h2 className="fh-card__title text-foreground">Add a new programme stage</h2>
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

  const feeHeadTabs = school.feeHeads.map((head) => ({
    label: head.label,
    content: (
      <div className="space-y-2">
        {canEdit ? (
          <form action={updateFeeHead.bind(null, school.code, head.id)} className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <label className="fh-label text-xs">Label</label>
              <input name="label" defaultValue={head.label} className="fh-input w-full" required />
            </div>
            <label className="flex items-center gap-1.5 text-sm text-muted">
              <input type="checkbox" name="isTotal" defaultChecked={head.isTotal} />
              Total
            </label>
            <label className="flex items-center gap-1.5 text-sm text-muted">
              <input type="checkbox" name="isRemainder" defaultChecked={head.isRemainder} />
              Remainder
            </label>
            <button type="submit" className="fh-btn fh-btn--outline fh-btn--sm">Save</button>
          </form>
        ) : (
          <span className="fh-badge fh-badge--neutral">{head.label}</span>
        )}
        {head.isTotal && (
          <p className="text-xs text-muted">
            <span className="fh-badge fh-badge--success">Total</span>{' '}
            — this school's grand total. Entered independently, same as any other head.
          </p>
        )}
        {head.isRemainder && (
          <p className="text-xs text-muted">
            <span className="fh-badge fh-badge--success">Remainder</span>{' '}
            — calculated automatically as Total minus every other head, not entered on its own in
            the Fee Builder.
          </p>
        )}
        {canEdit && (
          <form action={deleteFeeHead.bind(null, school.code, head.id)} className="border-t border-border pt-3">
            <button
              type="submit"
              className="fh-btn fh-btn--danger fh-btn--sm"
              disabled={head._count.feeLines > 0}
              title={head._count.feeLines > 0 ? `Has ${head._count.feeLines} fee line(s) recorded — cannot delete` : undefined}
            >
              Delete this fee head
            </button>
          </form>
        )}
      </div>
    ),
  }));

  const feeHeadsContent = (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        The fee categories this school charges — every school starts with its own set (e.g.
        "Tuition Fee", "Beyond Mandate"), and you can add more here as the need arises. Each head
        gets its own base fee and YoY increment %, set independently in the Fee Builder. Mark at
        most one head "Total" if it's the grand total a parent pays (e.g. "Total Fees to be
        charged from Parents") — it's still entered independently, on its own base/increment, not
        derived from the others. If some other head is the gap between Total and the rest (e.g.
        FSK's "Beyond Mandate" = Total minus the FRC-approved Tuition Fee), mark that one
        "Remainder" instead — it's calculated automatically and can't be entered on its own.
      </p>

      {feeHeadTabs.length > 0 ? (
        <section className="fh-card">
          <Tabs tabs={feeHeadTabs} />
        </section>
      ) : (
        <div className="fh-card text-sm text-muted">No fee heads yet — add one below.</div>
      )}

      {canEdit && (
        <section className="fh-card">
          <h2 className="fh-card__title text-foreground">Add a new fee head</h2>
          <form action={createFeeHead.bind(null, school.code)} className="mt-3 flex flex-wrap items-end gap-2">
            <div className="flex-1">
              <label className="fh-label text-xs">New fee head</label>
              <input name="label" placeholder="e.g. Beyond Mandate" className="fh-input" required />
            </div>
            <label className="flex items-center gap-1.5 text-sm text-muted">
              <input type="checkbox" name="isTotal" />
              Total
            </label>
            <label className="flex items-center gap-1.5 text-sm text-muted">
              <input type="checkbox" name="isRemainder" />
              Remainder
            </label>
            <button type="submit" className="fh-btn fh-btn--primary">Add fee head</button>
          </form>
        </section>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/master" className="text-sm text-primary hover:underline">← Master data</Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-foreground">{school.code}</h1>
          <span className="fh-badge">{school.board}</span>
        </div>
        <p className="text-muted">{school.name}</p>
      </div>

      <Tabs
        tabs={[
          { label: 'Programme & grades', content: programmeContent },
          { label: 'Fee heads', content: feeHeadsContent },
        ]}
      />
    </div>
  );
}
