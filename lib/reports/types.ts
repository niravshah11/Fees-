// Shared shape every module's report is built from — one row type, one column list, both format-
// agnostic. lib/reports/export.ts turns any ReportColumn<T>[] + T[] into CSV/XLSX/PDF; each
// module file (lib/reports/feeLines.ts etc.) only needs to supply the Prisma query + this list.
// Ported from the event-management app's lib/reports/ (same estate, same convention).

export type CellValue = string | number | boolean | null | undefined;

export interface ReportColumn<T> {
  key: string;
  label: string;
  get: (row: T) => CellValue;
}

/** Every report's baseline filter — the date range applies to that module's natural date field
 *  (see each module file's comment for which field that is). Both ends are inclusive; either or
 *  both may be omitted to mean "no lower/upper bound". */
export interface DateRangeFilter {
  from?: string; // yyyy-mm-dd
  to?: string; // yyyy-mm-dd
}

export function formatCell(value: CellValue): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

/** yyyy-mm-dd -> a Date at that day's start (UTC) — for building a Prisma `gte` bound. */
export function startOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/** yyyy-mm-dd -> a Date just past that day's end (UTC) — for a Prisma `lt` bound, so the whole
 *  day is included regardless of what time of day the stored value carries. */
export function endOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999Z`);
}
