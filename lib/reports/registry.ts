// The single place that ties every module's report data (lib/reports/<module>.ts) to a URL slug,
// so app/reports/[slug]/page.tsx and app/api/reports/[slug]/route.ts stay one generic
// implementation each instead of several near-identical ones. Add a new report by adding one
// entry here plus its lib/reports/<module>.ts data file — nothing else needs to change. Ported
// from the event-management app's lib/reports/registry.ts (same estate, same convention); the one
// difference is `filterFields` is async here, since campus options come from the DB (a campus can
// be added/removed at /master) rather than a hardcoded config list like the sibling app's.

import type { ReportColumn } from './types';
import { getFeeLinesReportRows, getFeeLinesFilterFields, FEE_LINES_COLUMNS } from './feeLines';
import { getApprovalsReportRows, getApprovalsFilterFields, APPROVALS_COLUMNS } from './approvals';

export interface ReportFilterOption {
  value: string;
  label: string;
}

/** One filter control the generic report page renders. 'daterange' always binds to the 'from'/
 *  'to' query keys; 'select' binds to its own `key`. */
export type ReportFilterField =
  | { type: 'daterange'; dateLabel: string }
  | { type: 'select'; key: string; label: string; options: ReportFilterOption[] };

export interface ReportDefinition {
  slug: string;
  title: string;
  description: string;
  filterFields: () => Promise<ReportFilterField[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRows: (filters: Record<string, string | undefined>) => Promise<any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ReportColumn<any>[];
}

export const REPORTS: ReportDefinition[] = [
  {
    slug: 'fee-lines',
    title: 'Fee Lines',
    description: 'Every grade band × fee head figure across every campus and academic year — base fee, increment %, and the computed amount, in one exportable table.',
    filterFields: getFeeLinesFilterFields,
    getRows: (f) => getFeeLinesReportRows(f),
    columns: FEE_LINES_COLUMNS,
  },
  {
    slug: 'approvals',
    title: 'Approval Chain',
    description: 'Every approval-chain decision across every campus and proposal — who decided, when, and any note left behind.',
    filterFields: getApprovalsFilterFields,
    getRows: (f) => getApprovalsReportRows(f),
    columns: APPROVALS_COLUMNS,
  },
];

export function getReportDefinition(slug: string): ReportDefinition | undefined {
  return REPORTS.find((r) => r.slug === slug);
}
