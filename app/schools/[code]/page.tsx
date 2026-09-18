import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentRights } from '@/lib/auth/rights';
import { canDraftForCampus, hasRole, type FeeRole } from '@/engine/rights';
import { computeApprovalState, isActionable } from '@/engine/approval';
import { projectFeeSchedule } from '@/engine/projection';
import { FEE_APPROVAL_CHAIN } from '@/engine/fee';
import { ProjectionChart, ProjectionLegend } from './_ProjectionChart';
import { FeeLineEditCard } from './_FeeLineEditCard';
import { STANDARD_GRADES } from '@/lib/grades';
import {
  createDraftVersion,
  updateFeeLine,
  bulkApplyIncrement,
  submitForReview,
  decideApproval,
} from './actions';
import {
  createProgrammeStage,
  updateProgrammeStage,
  deleteProgrammeStage,
  createGradeBands,
  updateGradeBand,
  deleteGradeBand,
} from '../../master/[code]/actions';

export const dynamic = 'force-dynamic';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'fh-badge--neutral',
  PENDING_APPROVAL: 'fh-badge--warning',
  APPROVED: 'fh-badge--success',
  REJECTED: 'fh-badge--danger',
  SUPERSEDED: 'fh-badge--neutral',
};

function nextAcademicYear(year: string): string {
  const match = year.match(/^(\d{4})-(\d{2})$/);
  if (!match) return '';
  const startYear = Number(match[1]) + 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

export default async function SchoolWorkspace({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const school = await prisma.school.findUnique({
    where: { code },
    include: {
      programmeStages: {
        orderBy: { order: 'asc' },
        include: { gradeBands: { orderBy: { order: 'asc' }, include: { _count: { select: { feeLines: true } } } } },
      },
      feeVersions: {
        orderBy: [{ academicYear: 'desc' }, { createdAt: 'desc' }],
        include: {
          feeLines: {
            include: { gradeBand: true },
            orderBy: { gradeBand: { order: 'asc' } },
          },
          approvals: { orderBy: { order: 'asc' } },
        },
      },
    },
  });
  if (!school) notFound();

  const grants = await getCurrentRights();
  const canDraft = canDraftForCampus(grants, school.code);
  const roleForRole = Object.fromEntries(
    FEE_APPROVAL_CHAIN.map((step) => [step.role, hasRole(grants, step.role as FeeRole)]),
  ) as Record<string, boolean>;
  const usedGrades = new Set(school.programmeStages.flatMap((s) => s.gradeBands.map((b) => b.label)));
  const availableGrades = STANDARD_GRADES.filter((g) => !usedGrades.has(g));

  const [current, ...history] = school.feeVersions;
  const approvedForCurrentYear = current?.status === 'APPROVED';
  const hasOpenDraftOrReview = current && (current.status === 'DRAFT' || current.status === 'PENDING_APPROVAL');

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-primary hover:underline">← Schools</Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-foreground">{school.code}</h1>
          <span className="fh-badge">{school.board}</span>
        </div>
        <p className="text-muted">{school.name}</p>
      </div>

      {/* Grade bands & programme stages */}
      <section className="fh-card">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-foreground">Grade bands &amp; programme stages</h2>
          <Link href={`/master/${school.code}`} className="text-sm text-primary hover:underline">Open in Master data →</Link>
        </div>
        <p className="mt-1 text-sm text-muted">
          Each grade band belongs to a programme stage. Editable right here, or at{' '}
          <Link href={`/master/${school.code}`} className="text-primary hover:underline">Master data</Link>.
        </p>

        <div className="mt-4 space-y-4">
          {school.programmeStages.map((stage) => (
            <div key={stage.id} className="rounded-lg border border-border p-3">
              {canDraft ? (
                <form action={updateProgrammeStage.bind(null, school.code, stage.id)} className="flex flex-wrap items-end gap-2">
                  <div className="flex-1">
                    <label className="fh-label text-xs">Programme / stage label</label>
                    <input name="label" defaultValue={stage.label} className="fh-input" required />
                  </div>
                  <button type="submit" className="fh-btn fh-btn--secondary fh-btn--sm">Save</button>
                  <form action={deleteProgrammeStage.bind(null, school.code, stage.id)}>
                    <button type="submit" className="text-xs text-red-600 hover:underline">Remove stage</button>
                  </form>
                </form>
              ) : (
                <div className="font-medium text-foreground">{stage.label}</div>
              )}

              <div className="mt-2 space-y-2">
                {stage.gradeBands.map((band) => (
                  <div key={band.id} className="flex flex-wrap items-end gap-2 rounded-md bg-surface-sunken p-2">
                    {canDraft ? (
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
                    {canDraft && (
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

                {canDraft && availableGrades.length > 0 && (
                  <form action={createGradeBands.bind(null, school.code, stage.id)} className="flex flex-wrap items-end gap-2 pt-1">
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
            </div>
          ))}
          {school.programmeStages.length === 0 && (
            <p className="text-sm text-muted">No programme stages yet — add one below.</p>
          )}
        </div>

        {canDraft && (
          <form action={createProgrammeStage.bind(null, school.code)} className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4">
            <div className="flex-1">
              <label className="fh-label text-xs">New programme / stage label</label>
              <input name="label" placeholder="e.g. MYP — Middle Years Programme" className="fh-input" required />
            </div>
            <button type="submit" className="fh-btn fh-btn--primary">Add stage</button>
          </form>
        )}
      </section>

      {/* Current proposal */}
      <section className="fh-card">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-foreground">Current proposal</h2>
          {current && (
            <span className={`fh-badge ${STATUS_BADGE[current.status] ?? ''}`}>{current.status.replace('_', ' ')}</span>
          )}
        </div>

        {!current && (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted">No fee proposal exists yet for {school.code}.</p>
            {canDraft && (
              <form action={createDraftVersion.bind(null, school.code)} className="flex items-end gap-2">
                <div>
                  <label className="fh-label text-xs">Academic year</label>
                  <input name="academicYear" placeholder="2027-28" className="fh-input" required />
                </div>
                <button type="submit" className="fh-btn fh-btn--primary">Start draft</button>
              </form>
            )}
          </div>
        )}

        {current && (
          <div className="mt-3 space-y-4">
            <div className="text-sm text-muted">
              Academic year <span className="font-medium text-foreground">{current.academicYear}</span>
              {current.notes && <> — {current.notes}</>}
            </div>

            {current.status === 'DRAFT' && canDraft ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {current.feeLines.map((line) => (
                  <FeeLineEditCard key={line.id} schoolCode={school.code} line={line} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="fh-table fh-table--striped">
                  <thead>
                    <tr>
                      <th>Grade band</th>
                      <th>Base fee</th>
                      <th>Increment %</th>
                      <th>Tuition fee</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.feeLines.map((line) => (
                      <tr key={line.id}>
                        <td>{line.gradeBand.label}</td>
                        <td>{inr.format(line.baseFee)}</td>
                        <td>{(Number(line.incrementPct) * 100).toFixed(2)}%</td>
                        <td className="font-medium">{inr.format(line.tuitionFee)}</td>
                        <td className="font-medium">{inr.format(line.totalFee)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {current.status === 'DRAFT' && canDraft && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="text-sm font-medium text-foreground">Bulk apply an increment % to a stage</div>
                <form action={bulkApplyIncrement.bind(null, school.code, current.id)} className="flex flex-wrap items-end gap-2">
                  <div>
                    <label className="fh-label text-xs">Stage</label>
                    <select name="programmeStageId" className="fh-input" required>
                      {school.programmeStages.map((stage) => (
                        <option key={stage.id} value={stage.id}>{stage.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="fh-label text-xs">Increment %</label>
                    <input name="incrementPct" type="number" step="0.1" placeholder="6" className="fh-input w-24" required />
                  </div>
                  <button type="submit" className="fh-btn fh-btn--secondary">Apply to stage</button>
                </form>

                <form action={submitForReview.bind(null, school.code, current.id)}>
                  <button type="submit" className="fh-btn fh-btn--primary">Submit for Group Review</button>
                </form>
              </div>
            )}

            {current.approvals.length > 0 && (
              <ApprovalPanel
                schoolCode={school.code}
                approvals={current.approvals}
                canActByRole={roleForRole}
              />
            )}

            {approvedForCurrentYear && !hasOpenDraftOrReview && canDraft && (
              <form action={createDraftVersion.bind(null, school.code)} className="flex items-end gap-2 border-t border-border pt-4">
                <div>
                  <label className="fh-label text-xs">Start next year's proposal</label>
                  <input
                    name="academicYear"
                    defaultValue={nextAcademicYear(current.academicYear)}
                    className="fh-input"
                    required
                  />
                </div>
                <button type="submit" className="fh-btn fh-btn--primary">Start draft</button>
              </form>
            )}
          </div>
        )}
      </section>

      {/* Projection preview */}
      {current && current.feeLines.length > 0 && (() => {
        const projectionYears: string[] = [current.academicYear];
        for (let i = 0; i < 5; i++) projectionYears.push(nextAcademicYear(projectionYears[projectionYears.length - 1]));

        return (
          <section className="fh-card">
            <h2 className="font-heading text-lg font-bold text-foreground">5-year projection preview</h2>
            <p className="mt-1 text-sm text-muted">
              Each grade band's current tuition fee compounded forward at its own current
              increment %. Preview only — not persisted; only the current year's proposal becomes
              a real FeeLine.
            </p>

            <div className="mt-4 rounded-lg border border-border p-4">
              <ProjectionChart
                yearLabels={projectionYears}
                lines={current.feeLines.map((line) => ({
                  label: line.gradeBand.label,
                  tuitionFee: line.tuitionFee,
                  incrementPct: Number(line.incrementPct),
                }))}
              />
              <ProjectionLegend
                lines={current.feeLines.map((line) => ({
                  label: line.gradeBand.label,
                  tuitionFee: line.tuitionFee,
                  incrementPct: Number(line.incrementPct),
                }))}
              />
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="fh-table fh-table--striped">
                <thead>
                  <tr>
                    <th>Grade band</th>
                    {projectionYears.map((year) => (
                      <th key={year}>{year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {current.feeLines.map((line) => {
                    const schedule = projectFeeSchedule(line.tuitionFee, Number(line.incrementPct), 5);
                    return (
                      <tr key={line.id}>
                        <td>{line.gradeBand.label}</td>
                        <td className="font-medium">{inr.format(line.tuitionFee)}</td>
                        {schedule.map((y) => (
                          <td key={y.yearOffset}>{inr.format(Math.round(y.fee))}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })()}

      {/* History */}
      {history.length > 0 && (
        <section className="fh-card">
          <h2 className="font-heading text-lg font-bold text-foreground">History</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="fh-table fh-table--striped">
              <thead>
                <tr>
                  <th>Academic year</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {history.map((v) => (
                  <tr key={v.id}>
                    <td>{v.academicYear}</td>
                    <td><span className={`fh-badge ${STATUS_BADGE[v.status] ?? ''}`}>{v.status.replace('_', ' ')}</span></td>
                    <td>{v.submittedAt ? new Date(v.submittedAt).toLocaleDateString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

const CHECK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const CROSS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

type ApprovalRow = { id: string; role: string; label: string; order: number; status: string; decidedBy: string | null; decidedAt: Date | null; note: string | null };

function ApprovalPanel({
  schoolCode,
  approvals,
  canActByRole,
}: {
  schoolCode: string;
  approvals: ApprovalRow[];
  canActByRole: Record<string, boolean>;
}) {
  const typedApprovals = approvals as Array<{ order: number; status: 'PENDING' | 'APPROVED' | 'REJECTED' }>;
  const state = computeApprovalState(typedApprovals);
  const activeStep = approvals.find((a) => isActionable(typedApprovals, a.order) && canActByRole[a.role]);

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="text-sm font-medium text-foreground">Approval chain</div>

      <div className="fh-stepper overflow-x-auto pb-1">
        {approvals.map((a) => {
          const actionable = isActionable(typedApprovals, a.order);
          const stepClass = a.status === 'APPROVED' ? 'is-complete' : a.status === 'REJECTED' ? 'is-danger' : actionable ? 'is-active' : '';
          return (
            <div key={a.id} className={`fh-stepper__step ${stepClass}`}>
              <span className="fh-stepper__dot">
                {a.status === 'APPROVED' ? CHECK_ICON : a.status === 'REJECTED' ? CROSS_ICON : a.order + 1}
              </span>
              <span className="fh-stepper__label">{a.label}</span>
              {a.decidedBy && (
                <span className="fh-stepper__meta">
                  {a.decidedBy}
                  {a.decidedAt ? ` · ${new Date(a.decidedAt).toLocaleDateString('en-IN')}` : ''}
                  {a.note ? ` · "${a.note}"` : ''}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {activeStep && (
        <div className="rounded-lg border border-border bg-primary-subtle p-3">
          <div className="text-sm font-medium text-foreground">Your decision: {activeStep.label}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <form action={decideApproval.bind(null, schoolCode, activeStep.id, 'APPROVED')} className="flex items-center gap-2">
              <input name="note" placeholder="Optional note" className="fh-input h-8 text-xs" />
              <button type="submit" className="fh-btn fh-btn--primary fh-btn--sm">Approve</button>
            </form>
            <form action={decideApproval.bind(null, schoolCode, activeStep.id, 'REJECTED')}>
              <button type="submit" className="fh-btn fh-btn--danger fh-btn--sm">Reject</button>
            </form>
          </div>
        </div>
      )}

      {state.overall === 'REJECTED' && (
        <p className="fh-alert fh-alert--danger text-sm">This proposal was rejected — start a new draft to revise it.</p>
      )}
    </div>
  );
}
