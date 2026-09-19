// Fee-version domain vocabulary + pure fee math. No I/O, no Prisma — see prisma/schema.prisma's
// header for why status fields are plain strings validated against the unions defined here.
//
// Source: `Provisional fee 2027-28.xlsx` ("10 Years Fees Kunkni"/"10 Years Fees Malgama") and
// `Tuition Fees Working 2024-25, 2025-26 and 2026-27.xlsx`. A grade band's headline fee is the SUM
// of its FeeLine.amount across every FeeHead a school has (Tuition Fee, Beyond Mandate, etc.) —
// each head is its own base/increment/amount, independently editable per grade band per year (no
// shared or carried-over rate). If one head is flagged isTotal (e.g. FSK/FSM's "Total Fees to be
// charged from Parents"), that head represents what a parent who opts into every optional service
// actually pays — its amount is CALCULATED as the sum of every other head (e.g. FRC-mandated
// Tuition Fee + optional Beyond Mandate), not independently entered — see computeGradeBandTotal
// and FeeHead's doc comment in schema.prisma.

export const FEE_VERSION_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'SUPERSEDED',
] as const;
export type FeeVersionStatus = (typeof FEE_VERSION_STATUSES)[number];

export const APPROVAL_DECISIONS = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type ApprovalDecision = (typeof APPROVAL_DECISIONS)[number];

// Values match engine/rights.ts's FeeRole exactly (not just in spirit) — decideApproval casts an
// approval row's `role` straight into assertHasRole(), so the two vocabularies must line up
// verbatim or every decision fails authorisation even for a genuine grant of that role.
export type FeeApprovalRole = 'FEES_GROUP_COORDINATOR' | 'HEAD_OF_OPERATIONS' | 'DIRECTOR' | 'BOARD_TRUSTEE';

export interface FeeApprovalStep {
  role: FeeApprovalRole;
  label: string;
  hint: string;
}

/** The real group sign-off chain, confirmed with the user: Fees Group Coordinator -> Head of
 *  Operations -> Director -> Board of Trustees. Sequential — each step only becomes actionable
 *  once every step before it has approved (engine/approval.ts). */
export const FEE_APPROVAL_CHAIN: FeeApprovalStep[] = [
  { role: 'FEES_GROUP_COORDINATOR', label: 'Fees Group Coordinator', hint: 'First group-level check across all campuses' },
  { role: 'HEAD_OF_OPERATIONS', label: 'Head of Operations', hint: 'Group-wide operations sign-off' },
  { role: 'DIRECTOR', label: 'Director', hint: 'Director-level sign-off' },
  { role: 'BOARD_TRUSTEE', label: 'Board of Trustees', hint: 'Final sign-off' },
];

/**
 * One fee head's amount for the next year: base × (1 + increment%), rounded to the nearest
 * rupee. Worked example (10 Years Fees Kunkni!E4): 145100 × 1.06 = 153806.
 */
export function computeIncrementedFee(baseFee: number, incrementPct: number): number {
  return Math.round(baseFee * (1 + incrementPct));
}

/** A grade band's headline total — the sum of its amount across every fee head it has a line
 *  for. Variadic so it works whether a school has one head (just Tuition Fee) or several
 *  (Tuition Fee + Beyond Mandate + ...); order doesn't matter. */
export function computeTotalFee(...amounts: number[]): number {
  return amounts.reduce((sum, a) => sum + a, 0);
}

/** A grade band's headline total: the sum of every fee head EXCEPT one flagged isTotal, if a
 *  school has one (e.g. FSK/FSM's "Total Fees to be charged from Parents" = Tuition Fee + Beyond
 *  Mandate) — that head's own stored amount is ignored, since it's calculated here rather than
 *  independently entered (confirmed with the user: a parent who opts into every optional service
 *  pays the sum of the mandatory head(s) plus every optional one). With no isTotal head, sums
 *  every line, same as computeTotalFee. */
export function computeGradeBandTotal(lines: { amount: number; feeHead: { isTotal: boolean } }[]): number {
  const hasTotalHead = lines.some((l) => l.feeHead.isTotal);
  const contributing = hasTotalHead ? lines.filter((l) => !l.feeHead.isTotal) : lines;
  return computeTotalFee(...contributing.map((l) => l.amount));
}
