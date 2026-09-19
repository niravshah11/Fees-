// Report data for the Approval Chain — one row per FeeApproval step, across every campus and
// proposal: who decided, when, and any note. Date field: decidedAt (undecided steps are excluded
// by a date-range filter, same as they'd be absent from a decision log). Categorical filters:
// campus, role, decision status.

import { prisma } from '../db';
import type { ReportFilterField, ReportFilterOption } from './registry';
import { endOfDay, startOfDay, type DateRangeFilter, type ReportColumn } from './types';
import { APPROVAL_DECISIONS, FEE_APPROVAL_CHAIN } from '../../engine/fee';

export interface ApprovalsFilters extends DateRangeFilter {
  campus?: string;
  role?: string;
  status?: string;
}

export interface ApprovalReportRow {
  schoolCode: string;
  schoolName: string;
  academicYear: string;
  role: string;
  label: string;
  order: number;
  status: string;
  decidedBy: string | null;
  decidedAt: Date | null;
  note: string | null;
}

export async function getApprovalsReportRows(filters: ApprovalsFilters): Promise<ApprovalReportRow[]> {
  const approvals = await prisma.feeApproval.findMany({
    where: {
      decidedAt: {
        ...(filters.from ? { gte: startOfDay(filters.from) } : {}),
        ...(filters.to ? { lte: endOfDay(filters.to) } : {}),
      },
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      feeVersion: {
        ...(filters.campus ? { school: { code: filters.campus } } : {}),
      },
    },
    orderBy: [{ decidedAt: 'desc' }],
    select: {
      role: true,
      label: true,
      order: true,
      status: true,
      decidedBy: true,
      decidedAt: true,
      note: true,
      feeVersion: {
        select: {
          academicYear: true,
          school: { select: { code: true, name: true } },
        },
      },
    },
  });

  return approvals.map((a) => ({
    schoolCode: a.feeVersion.school.code,
    schoolName: a.feeVersion.school.name,
    academicYear: a.feeVersion.academicYear,
    role: a.role,
    label: a.label,
    order: a.order,
    status: a.status,
    decidedBy: a.decidedBy,
    decidedAt: a.decidedAt,
    note: a.note,
  }));
}

async function campusOptions(): Promise<ReportFilterOption[]> {
  const schools = await prisma.school.findMany({ orderBy: { order: 'asc' }, select: { code: true, name: true } });
  return schools.map((s) => ({ value: s.code, label: `${s.code} — ${s.name}` }));
}

export async function getApprovalsFilterFields(): Promise<ReportFilterField[]> {
  const campuses = await campusOptions();
  return [
    { type: 'daterange', dateLabel: 'Decided on' },
    { type: 'select', key: 'campus', label: 'Campus', options: campuses },
    { type: 'select', key: 'role', label: 'Role', options: FEE_APPROVAL_CHAIN.map((s) => ({ value: s.role, label: s.label })) },
    { type: 'select', key: 'status', label: 'Status', options: APPROVAL_DECISIONS.map((s) => ({ value: s, label: s })) },
  ];
}

export const APPROVALS_COLUMNS: ReportColumn<ApprovalReportRow>[] = [
  { key: 'schoolCode', label: 'Campus', get: (r) => r.schoolCode },
  { key: 'academicYear', label: 'Academic Year', get: (r) => r.academicYear },
  { key: 'label', label: 'Role', get: (r) => r.label },
  { key: 'status', label: 'Status', get: (r) => r.status },
  { key: 'decidedBy', label: 'Decided By', get: (r) => r.decidedBy },
  { key: 'decidedAt', label: 'Decided At', get: (r) => (r.decidedAt ? r.decidedAt.toISOString().slice(0, 10) : null) },
  { key: 'note', label: 'Note', get: (r) => r.note },
];
