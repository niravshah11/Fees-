export function nextAcademicYear(year: string): string {
  const match = year.match(/^(\d{4})-(\d{2})$/);
  if (!match) return '';
  const startYear = Number(match[1]) + 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

export function previousAcademicYear(year: string): string {
  const match = year.match(/^(\d{4})-(\d{2})$/);
  if (!match) return '';
  const startYear = Number(match[1]) - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

/** `fromYear` plus the next `count - 1` academic years, in order — the dropdown of choices for
 *  starting a new proposal, so nobody has to type/format the year by hand. */
export function academicYearOptions(fromYear: string, count: number): string[] {
  const years = [fromYear];
  for (let i = 1; i < count; i++) years.push(nextAcademicYear(years[years.length - 1]));
  return years;
}

/** The academic year straddling `now` — Fountainhead's academic year runs April to March, so
 *  September 2026 falls in "2026-27" but February 2027 is still "2026-27" too. Used to center a
 *  year dropdown when there's no existing record (e.g. a school's first fee-policy upload) to
 *  derive one from. */
export function currentAcademicYear(now: Date = new Date()): string {
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String((year + 1) % 100).padStart(2, '0')}`;
}

/** A window of academic years spanning `back` years before `centerYear` through `forward` years
 *  after it, inclusive of `centerYear` itself — the standard shape for a "pick a year" dropdown
 *  that must always include whatever value is already selected. */
export function academicYearWindow(centerYear: string, back: number, forward: number): string[] {
  let start = centerYear;
  for (let i = 0; i < back; i++) start = previousAcademicYear(start);
  return academicYearOptions(start, back + forward + 1);
}
