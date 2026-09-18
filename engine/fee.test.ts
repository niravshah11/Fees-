import { describe, it, expect } from 'vitest';
import { computeIncrementedFee, computeTotalFee, FEE_APPROVAL_CHAIN } from './fee';

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
  it('sums tuition + term + admission', () => {
    expect(computeTotalFee(153806, 20157, 0)).toBe(173963);
  });

  it('defaults term/admission to 0 for a lump-sum-only fee line', () => {
    expect(computeTotalFee(378000)).toBe(378000);
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
