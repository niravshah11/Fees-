import { describe, it, expect } from 'vitest';
import { projectFeeSchedule } from './projection';

describe('projectFeeSchedule — worked example (10 Years Fees Kunkni.xlsx, Jr. & Sr. KG row)', () => {
  it('compounds 6% flat off the unrounded prior year, matching columns E-I', () => {
    const schedule = projectFeeSchedule(145100, 0.06, 5);
    const fees = schedule.map((y) => y.fee);
    expect(fees[0]).toBeCloseTo(153806, 6); // E4
    expect(fees[1]).toBeCloseTo(163034.36, 6); // F4
    expect(fees[2]).toBeCloseTo(172816.4216, 6); // G4
    expect(fees[3]).toBeCloseTo(183185.406896, 6); // H4
    expect(fees[4]).toBeCloseTo(194176.53130976, 6); // I4
  });

  it('numbers year offsets starting at 1', () => {
    const schedule = projectFeeSchedule(100000, 0.05, 3);
    expect(schedule.map((y) => y.yearOffset)).toEqual([1, 2, 3]);
  });

  it('returns an empty schedule for 0 years', () => {
    expect(projectFeeSchedule(100000, 0.05, 0)).toEqual([]);
  });
});
