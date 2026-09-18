// Sequential Draft -> Group Review -> Board Approval chain logic (pure + testable) — same shape
// as the event-management app's engine/approval.ts (Trip Approval), adapted to FEE_APPROVAL_CHAIN.
// A step becomes actionable only when every prior step is APPROVED. Any REJECTED step stops the
// chain and rejects the fee version. All APPROVED => fee version APPROVED.

import { FEE_APPROVAL_CHAIN, type ApprovalDecision, type FeeVersionStatus } from './fee';

export interface ApprovalLike {
  order: number;
  status: ApprovalDecision;
}

export interface ApprovalState {
  total: number;
  approved: number;
  /** order of the step awaiting a decision, or null if the chain is settled */
  currentOrder: number | null;
  /** overall fee-version status derived from the chain */
  overall: Extract<FeeVersionStatus, 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'>;
  rejectedOrder: number | null;
  pct: number;
}

/** Build the initial (all-pending) chain rows for a newly submitted fee version. */
export function buildApprovalChain() {
  return FEE_APPROVAL_CHAIN.map((step, order) => ({
    role: step.role,
    label: step.label,
    order,
    status: 'PENDING' as ApprovalDecision,
  }));
}

export function computeApprovalState(approvals: ApprovalLike[]): ApprovalState {
  const sorted = [...approvals].sort((a, b) => a.order - b.order);
  const total = sorted.length;
  const approved = sorted.filter((a) => a.status === 'APPROVED').length;
  const rejected = sorted.find((a) => a.status === 'REJECTED');

  let overall: ApprovalState['overall'];
  let currentOrder: number | null;

  if (rejected) {
    overall = 'REJECTED';
    currentOrder = null;
  } else if (approved === total && total > 0) {
    overall = 'APPROVED';
    currentOrder = null;
  } else {
    overall = 'PENDING_APPROVAL';
    currentOrder = sorted.find((a) => a.status !== 'APPROVED')?.order ?? null;
  }

  const pct = total === 0 ? 0 : Math.round((approved / total) * 100);
  return { total, approved, currentOrder, overall, rejectedOrder: rejected?.order ?? null, pct };
}

/** Only the current pending step may be decided (sequential gate). */
export function isActionable(approvals: ApprovalLike[], order: number): boolean {
  return computeApprovalState(approvals).currentOrder === order;
}
