import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentRights } from '@/lib/auth/rights';
import { hasRoleForCampus, type FeeRole } from '@/engine/rights';
import { computeApprovalState, isActionable } from '@/engine/approval';
import { projectFeeSchedule } from '@/engine/projection';
import { FEE_APPROVAL_CHAIN, computeGradeBandTotal } from '@/engine/fee';
import { nextAcademicYear, academicYearOptions } from '@/lib/academic-year';
import { FeeLineEditCard } from './_FeeLineEditCard';
import {
  createDraftVersion,
  bulkApplyIncrement,
  submitForReview,
  decideApproval,
} from './actions';

export const dynamic = 'force-dynamic';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'fh-badge--neutral',
  PENDING_APPROVAL: 'fh-badge--warning',
  APPROVED: 'fh-badge--success',
  REJECTED: 'fh-badge--danger',
  SUPERSEDED: 'fh-badge--neutral',
};

interface FeeLineRow {
  id: string;
  gradeBandId: string;
  gradeBand: { id: string; label: string; order: number };
  feeHeadId: string;
  feeHead: { id: string; label: string; isTotal: boolean };
  baseFee: number;
  incrementPct: unknown;
  amount: number;
}

/** Groups a version's flat FeeLine list (one row per grade band x fee head) back into per-grade-band
 *  buckets for rendering — every place fees show up in this UI is organized by grade band first,
 *  fee head second. */
function groupByGradeBand(lines: FeeLineRow[]) {
  const map = new Map<string, { gradeBand: FeeLineRow['gradeBand']; lines: FeeLineRow[] }>();
  for (const line of lines) {
    const bucket = map.get(line.gradeBandId) ?? { gradeBand: line.gradeBand, lines: [] };
    bucket.lines.push(line);
    map.set(line.gradeBandId, bucket);
  }
  return [...map.values()].sort((a, b) => a.gradeBand.order - b.gradeBand.order);
}

export default async function SchoolWorkspace({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const school = await prisma.school.findUnique({
    where: { code },
    include: {
      programmeStages: { orderBy: { order: 'asc' }, include: { gradeBands: { orderBy: { order: 'asc' } } } },
      feeHeads: { orderBy: { order: 'asc' } },
      feeVersions: {
        orderBy: [{ academicYear: 'desc' }, { createdAt: 'desc' }],
        include: {
          feeLines: {
            include: { gradeBand: true, feeHead: true },
            orderBy: [{ gradeBand: { order: 'asc' } }, { feeHead: { order: 'asc' } }],
          },
          approvals: { orderBy: { order: 'asc' } },
        },
      },
    },
  });
  if (!school) notFound();

  const grants = await getCurrentRights();
  // Drafting/editing a proposal is open to every signed-in colleague — there is no dedicated
  // "editor" role (confirmed with the user); only the approval chain itself is role-gated.
  const canDraft = true;
  const roleForRole = Object.fromEntries(
    FEE_APPROVAL_CHAIN.map((step) => [step.role, hasRoleForCampus(grants, step.role as FeeRole, school.code)]),
  ) as Record<string, boolean>;

  const [current, ...history] = school.feeVersions;
  const approvedForCurrentYear = current?.status === 'APPROVED';
  const hasOpenDraftOrReview = current && (current.status === 'DRAFT' || current.status === 'PENDING_APPROVAL');
  const currentGroups = current ? groupByGradeBand(current.feeLines) : [];
  const totalHead = school.feeHeads.find((h) => h.isTotal);

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

      {current && approvedForCurrentYear && !hasOpenDraftOrReview && canDraft && (
        <section className="fh-card fh-card--accent-top">
          <form action={createDraftVersion.bind(null, school.code)} className="flex flex-wrap items-end gap-3">
            <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary sm:flex" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <div>
              <label className="fh-label text-xs">Start next year's proposal</label>
              <select name="academicYear" className="fh-input" required defaultValue={nextAcademicYear(current.academicYear)}>
                {academicYearOptions(nextAcademicYear(current.academicYear), 10).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="fh-btn fh-btn--primary">Start draft</button>
          </form>
        </section>
      )}

      {/* Grade bands & programme stages — read-only outcome of Master data; edited there only,
          so this page stays focused on the fee proposal itself rather than duplicating a second
          copy of the same edit forms. */}
      <section className="fh-card">
        <div className="flex items-center justify-between">
          <h2 className="fh-card__title text-foreground">Grade bands &amp; programme stages</h2>
          <Link href={`/master/${school.code}`} className="fh-btn fh-btn--outline fh-btn--sm">Edit in Master data</Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {school.programmeStages.map((stage) => (
            <div key={stage.id} className="rounded-lg border border-border p-3">
              <div className="font-medium text-foreground">{stage.label}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {stage.gradeBands.map((band) => (
                  <span key={band.id} className="fh-badge fh-badge--neutral">{band.label}</span>
                ))}
                {stage.gradeBands.length === 0 && <span className="text-sm text-muted">No grade bands yet</span>}
              </div>
            </div>
          ))}
          {school.programmeStages.length === 0 && (
            <p className="text-sm text-muted">
              No programme stages yet — add one at <Link href={`/master/${school.code}`} className="text-primary hover:underline">Master data</Link>.
            </p>
          )}
        </div>
      </section>

      {/* Current proposal */}
      <section className="fh-card">
        <div className="flex items-center justify-between">
          <h2 className="fh-card__title text-foreground">Current proposal</h2>
          {current && (
            <span className={`fh-badge ${STATUS_BADGE[current.status] ?? ''}`}>{current.status.replace('_', ' ')}</span>
          )}
        </div>

        {!current && (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted">No fee proposal exists yet for {school.code}.</p>
            {school.feeHeads.length === 0 && (
              <p className="fh-alert fh-alert--warning text-sm">
                {school.code} has no fee heads yet — add at least one at{' '}
                <Link href={`/master/${school.code}`} className="underline">Master data</Link> before starting a draft.
              </p>
            )}
            {canDraft && school.feeHeads.length > 0 && (
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
              <div className="space-y-3">
                {currentGroups.map(({ gradeBand, lines }) => {
                  const total = computeGradeBandTotal(lines);
                  const editableLines = lines.filter((l) => !l.feeHead.isTotal);
                  return (
                    <div key={gradeBand.id} className="rounded-lg border border-border bg-surface-sunken p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-heading font-bold text-foreground">{gradeBand.label}</div>
                        <div className="text-sm">
                          <span className="text-muted">{totalHead ? `${totalHead.label} ` : 'Total '}</span>
                          <span className="font-heading text-base font-bold text-[var(--fh-color-primary-text)]">{inr.format(total)}</span>
                        </div>
                      </div>
                      {totalHead && (
                        <p className="mt-1 text-xs text-muted">
                          {totalHead.label} is calculated automatically as the sum of the heads below — it isn't entered separately.
                        </p>
                      )}
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {editableLines.map((line) => (
                          <FeeLineEditCard
                            key={line.id}
                            schoolCode={school.code}
                            title={line.feeHead.label}
                            line={{ id: line.id, baseFee: line.baseFee, incrementPct: Number(line.incrementPct) }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="fh-table fh-table--striped">
                  <thead>
                    <tr>
                      <th>Grade band</th>
                      {school.feeHeads.map((head) => (
                        <th key={head.id}>{head.label}</th>
                      ))}
                      {!totalHead && <th>Total</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {currentGroups.map(({ gradeBand, lines }) => {
                      const total = computeGradeBandTotal(lines);
                      return (
                        <tr key={gradeBand.id}>
                          <td>{gradeBand.label}</td>
                          {school.feeHeads.map((head) => {
                            if (head.isTotal) return <td key={head.id} className="font-medium">{inr.format(total)}</td>;
                            const line = lines.find((l) => l.feeHeadId === head.id);
                            return <td key={head.id}>{line ? inr.format(line.amount) : '—'}</td>;
                          })}
                          {!totalHead && <td className="font-medium">{inr.format(total)}</td>}
                        </tr>
                      );
                    })}
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
                    <label className="fh-label text-xs">Fee head</label>
                    <select name="feeHeadId" className="fh-input" required>
                      {school.feeHeads.filter((head) => !head.isTotal).map((head) => (
                        <option key={head.id} value={head.id}>{head.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="fh-label text-xs">Increment %</label>
                    <input name="incrementPct" type="number" step="0.1" placeholder="6" className="fh-input w-24" required />
                  </div>
                  <button type="submit" className="fh-btn fh-btn--outline">Apply to stage</button>
                </form>

                <form action={submitForReview.bind(null, school.code, current.id)}>
                  <button type="submit" className="fh-btn fh-btn--primary">Submit for Group Review</button>
                </form>
              </div>
            )}

          </div>
        )}
      </section>

      {/* Projection preview */}
      {current && current.feeLines.length > 0 && (() => {
        const projectionYears: string[] = [current.academicYear];
        for (let i = 0; i < 5; i++) projectionYears.push(nextAcademicYear(projectionYears[projectionYears.length - 1]));

        const series = currentGroups.map(({ gradeBand, lines }) => {
          const contributingLines = lines.filter((l) => !l.feeHead.isTotal);
          const perHeadSchedules = contributingLines.map((line) => {
            const schedule = projectFeeSchedule(line.amount, Number(line.incrementPct), 5);
            return [line.amount, ...schedule.map((y) => y.fee)];
          });
          const points = Array.from({ length: 6 }, (_, i) => perHeadSchedules.reduce((sum, sched) => sum + sched[i], 0));
          return { label: gradeBand.label, points };
        });

        return (
          <section className="fh-card">
            <h2 className="fh-card__title text-foreground">5-year projection preview</h2>
            <p className="mt-1 text-sm text-muted">
              Each grade band's current total — the sum of every fee head{totalHead ? ` except ${totalHead.label}, which is calculated from the others` : ''}
              {' '}— compounded forward at each head's own current increment %. Preview only — not
              persisted; only the current year's proposal becomes real FeeLines.
            </p>

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
                  {series.map((s) => (
                    <tr key={s.label}>
                      <td>{s.label}</td>
                      {s.points.map((v, i) => (
                        <td key={i} className={i === 0 ? 'font-medium' : undefined}>{inr.format(Math.round(v))}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })()}

      {/* History */}
      {history.length > 0 && (
        <section className="fh-card">
          <h2 className="fh-card__title text-foreground">History</h2>
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

      {/* Approval chain — comes last: review the numbers and projection first, then see where
          the proposal actually stands in sign-off. */}
      {current && current.approvals.length > 0 && (
        <section className="fh-card">
          <ApprovalPanel
            schoolCode={school.code}
            approvals={current.approvals}
            canActByRole={roleForRole}
          />
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
