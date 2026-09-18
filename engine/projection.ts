// Multi-year fee projection — reproduces the "10 Years Fees Kunkni/Malgama" sheets' compounding:
// a flat YoY % applied to the PRIOR YEAR'S UNROUNDED fee, year over year. Preview-only (see
// fee.ts's header) — nothing here is persisted; only the next year's proposal becomes a FeeLine.

export interface ProjectionYear {
  /** 1 = the first projected year after baseFee's year, 2 = the year after that, etc. */
  yearOffset: number;
  fee: number;
}

/**
 * Worked example (10 Years Fees Kunkni!E4:I4, Jr. & Sr. KG @ 6%): base 145100 ->
 * [153806, 163034.36, 172816.4216, 183185.406896, 194176.53130976].
 * Deliberately NOT rounded per year (matching the source sheet) — round only where displayed.
 */
export function projectFeeSchedule(baseFee: number, incrementPct: number, years: number): ProjectionYear[] {
  const schedule: ProjectionYear[] = [];
  let fee = baseFee;
  for (let yearOffset = 1; yearOffset <= years; yearOffset++) {
    fee = fee * (1 + incrementPct);
    schedule.push({ yearOffset, fee });
  }
  return schedule;
}
