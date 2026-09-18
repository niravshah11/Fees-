// Fee-version domain vocabulary + pure fee math. No I/O, no Prisma — see prisma/schema.prisma's
// header for why status fields are plain strings validated against the unions defined here.
//
// Source: `Provisional fee 2027-28.xlsx` ("10 Years Fees Kunkni"/"10 Years Fees Malgama") and
// `Tuition Fees Working 2024-25, 2025-26 and 2026-27.xlsx`. Term-fee and admission-fee amounts in
// those sheets are informational/editable inputs on a FeeLine, not derived by a formula here —
// the workbooks show several inconsistent reconstructions of how they're split out, so this app
// only automates the part that's unambiguous across every sheet: tuition fee = base × (1 + YoY%).

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
 * Tuition fee for the next year: base × (1 + increment%), rounded to the nearest rupee.
 * Worked example (10 Years Fees Kunkni!E4): 145100 × 1.06 = 153806.
 */
export function computeIncrementedFee(baseFee: number, incrementPct: number): number {
  return Math.round(baseFee * (1 + incrementPct));
}

/** Headline fee shown to parents = tuition + term + admission. Each input defaults to 0 so a
 *  school that bundles everything into one lump-sum tuition figure (e.g. FSM's Parent
 *  Undertaking base) doesn't have to fill in fields it doesn't use. */
export function computeTotalFee(tuitionFee: number, termFee = 0, admissionFee = 0): number {
  return tuitionFee + termFee + admissionFee;
}
