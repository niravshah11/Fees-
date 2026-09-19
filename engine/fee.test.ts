import { describe, it, expect } from 'vitest';
import { computeIncrementedFee, computeTotalFee, computeGradeBandTotal, computeRemainderHeadAmount, FEE_APPROVAL_CHAIN } from './fee';

describe('computeIncrementedFee — worked examples (10 Years Fees Kunkni.xlsx)', () => {
  it('FSK Jr. & Sr. KG, EYP-to-MYP stage: 2026-27 FRC 145100 -> 2027-28 at 6%', () => {
    // 10 Years Fees Kunkni!E4 = 153806
    expect(computeIncrementedFee(145100, 0.06)).toBe(153806);
  });

  it('FSK Grade 11 & 12, DP stage: 2026-27 FRC 400540 -> 2027-28 at 5%', () => {
    // 10 Years Fees Kunkni!E7 = 420567
    expect(computeIncrementedFee(400540, 0.05)).toBe(420567);
  });

  it('FSM Jr. & Sr. KG, EYP & PYP stage: 2027-28 base 378000 -> 2028-29 at 9%', () => {
    // 10 Years Fees Malgama!C4 = 412020
    expect(computeIncrementedFee(378000, 0.09)).toBe(412020);
  });

  it('rounds to the nearest rupee', () => {
    expect(computeIncrementedFee(1000, 0.055)).toBe(1055);
    expect(computeIncrementedFee(333, 0.1)).toBe(366); // 366.3 -> 366
  });
});

describe('computeTotalFee', () => {
  it('sums amounts across however many fee heads a school has', () => {
    expect(computeTotalFee(153806, 20157)).toBe(173963); // Tuition Fee + Beyond Mandate
    expect(computeTotalFee(153806, 20157, 5000)).toBe(178963); // + a third head
  });

  it('works for a school with just one fee head', () => {
    expect(computeTotalFee(378000)).toBe(378000);
  });

  it('returns 0 for no heads at all', () => {
    expect(computeTotalFee()).toBe(0);
  });
});

describe('computeGradeBandTotal', () => {
  it('sums every line when no head is flagged isTotal', () => {
    const lines = [
      { amount: 153806, feeHead: { isTotal: false } },
      { amount: 20157, feeHead: { isTotal: false } },
    ];
    expect(computeGradeBandTotal(lines)).toBe(173963);
  });

  it('uses the isTotal head\'s own amount instead of summing (FSK 3-slab structure)', () => {
    const lines = [
      { amount: 203268, feeHead: { isTotal: true } }, // Total Fees to be charged from Parents
      { amount: 153806, feeHead: { isTotal: false } }, // Tuition Fee (FRC-mandated)
      { amount: 49462, feeHead: { isTotal: false } }, // Beyond Mandate (derived)
    ];
    expect(computeGradeBandTotal(lines)).toBe(203268); // the Total head's own amount, not a sum
  });
});

describe('computeRemainderHeadAmount', () => {
  it('is the isTotal head\'s amount minus every other head (FSK Jr. & Sr. KG, 2027-28 worked example)', () => {
    // Real FSK figures, confirmed with the user: Total Fees 203268, FRC Tuition Fee 153806 ->
    // Beyond Mandate = 203268 - 153806 = 49462.
    const lines = [
      { amount: 203268, feeHead: { isTotal: true, isRemainder: false } },
      { amount: 153806, feeHead: { isTotal: false, isRemainder: false } },
      { amount: 0, feeHead: { isTotal: false, isRemainder: true } }, // stored amount is unused
    ];
    expect(computeRemainderHeadAmount(lines)).toBe(49462);
  });

  it('returns null when there is no isTotal head to derive from', () => {
    const lines = [
      { amount: 153806, feeHead: { isTotal: false, isRemainder: false } },
      { amount: 0, feeHead: { isTotal: false, isRemainder: true } },
    ];
    expect(computeRemainderHeadAmount(lines)).toBeNull();
  });

  it('returns null when there is no isRemainder head at all', () => {
    const lines = [
      { amount: 203268, feeHead: { isTotal: true, isRemainder: false } },
      { amount: 153806, feeHead: { isTotal: false, isRemainder: false } },
    ];
    expect(computeRemainderHeadAmount(lines)).toBeNull();
  });
});

describe('FEE_APPROVAL_CHAIN', () => {
  it('is Fees Group Coordinator -> Head of Operations -> Director -> Board of Trustees, in that order', () => {
    expect(FEE_APPROVAL_CHAIN.map((s) => s.role)).toEqual([
      'FEES_GROUP_COORDINATOR',
      'HEAD_OF_OPERATIONS',
      'DIRECTOR',
      'BOARD_TRUSTEE',
    ]);
  });
});
