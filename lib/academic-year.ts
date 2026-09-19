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
