import { describe, it, expect } from 'vitest';
import { buildApprovalChain, computeApprovalState, isActionable, type ApprovalLike } from './approval';
import { FEE_APPROVAL_CHAIN } from './fee';

const chain = (statuses: Array<'PENDING' | 'APPROVED' | 'REJECTED'>): ApprovalLike[] =>
  statuses.map((status, order) => ({ order, status }));

describe('buildApprovalChain', () => {
  it('creates the 4-step Fees Group Coordinator -> Head of Operations -> Director -> Board of Trustees chain, all pending', () => {
    const built = buildApprovalChain();
    expect(built).toHaveLength(4);
    expect(built.map((s) => s.role)).toEqual([
      'FEES_GROUP_COORDINATOR',
      'HEAD_OF_OPERATIONS',
      'DIRECTOR',
      'BOARD_TRUSTEE',
    ]);
    expect(built.every((s) => s.status === 'PENDING')).toBe(true);
    expect(built.map((s) => s.order)).toEqual([0, 1, 2, 3]);
    expect(FEE_APPROVAL_CHAIN[3].role).toBe('BOARD_TRUSTEE'); // Board is final
  });
});

describe('computeApprovalState', () => {
  it('makes the Fees Group Coordinator active on a fresh chain', () => {
    const s = computeApprovalState(chain(['PENDING', 'PENDING', 'PENDING', 'PENDING']));
    expect(s.overall).toBe('PENDING_APPROVAL');
    expect(s.currentOrder).toBe(0);
    expect(s.pct).toBe(0);
  });

  it('advances the active step as prior steps approve', () => {
    const s = computeApprovalState(chain(['APPROVED', 'APPROVED', 'PENDING', 'PENDING']));
    expect(s.currentOrder).toBe(2);
    expect(s.approved).toBe(2);
    expect(s.pct).toBe(50);
    expect(s.overall).toBe('PENDING_APPROVAL');
  });

  it('marks the version APPROVED only once every step, including the Board, approves', () => {
    const s = computeApprovalState(chain(['APPROVED', 'APPROVED', 'APPROVED', 'APPROVED']));
    expect(s.overall).toBe('APPROVED');
    expect(s.currentOrder).toBeNull();
    expect(s.pct).toBe(100);
  });

  it('rejects and stops the chain when any step rejects', () => {
    const s = computeApprovalState(chain(['APPROVED', 'REJECTED', 'PENDING', 'PENDING']));
    expect(s.overall).toBe('REJECTED');
    expect(s.rejectedOrder).toBe(1);
    expect(s.currentOrder).toBeNull();
  });
});

describe('isActionable — sequential gate', () => {
  it('a later step cannot act before every prior step has approved', () => {
    const c = chain(['APPROVED', 'PENDING', 'PENDING', 'PENDING']);
    expect(isActionable(c, 1)).toBe(true); // current: Head of Operations
    expect(isActionable(c, 2)).toBe(false); // Director — gated
    expect(isActionable(c, 3)).toBe(false); // Board — gated
    expect(isActionable(c, 0)).toBe(false); // already approved
  });

  it('blocks every step once rejected', () => {
    const c = chain(['REJECTED', 'PENDING', 'PENDING', 'PENDING']);
    expect(isActionable(c, 0)).toBe(false);
    expect(isActionable(c, 1)).toBe(false);
  });
});
