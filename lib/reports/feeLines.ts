// Report data for Fee Lines — the grain is one row per (grade band x fee head) figure, the same
// atom the Fee Builder itself edits, so this report can compile every campus's numbers into one
// exportable table regardless of how many/which heads each school has. Date field: updatedAt
// (when that figure was last touched). Categorical filters: academic year, campus, version status.

import { prisma } from '../db';
import type { ReportFilterField, ReportFilterOption } from './registry';
import { endOfDay, startOfDay, type DateRangeFilter, type ReportColumn } from './types';
import { FEE_VERSION_STATUSES } from '../../engine/fee';

export interface FeeLinesFilters extends DateRangeFilter {
  academicYear?: string;
  campus?: string;
  status?: string;
}

export interface FeeLineReportRow {
  schoolCode: string;
  schoolName: string;
  academicYear: string;
  versionStatus: string;
  gradeBand: string;
  feeHead: string;
  isTotal: boolean;
  isRemainder: boolean;
  baseFee: number;
  incrementPct: number;
  amount: number;
  updatedAt: Date;
}

export async function getFeeLinesReportRows(filters: FeeLinesFilters): Promise<FeeLineReportRow[]> {
  const lines = await prisma.feeLine.findMany({
    where: {
      updatedAt: {
        ...(filters.from ? { gte: startOfDay(filters.from) } : {}),
        ...(filters.to ? { lte: endOfDay(filters.to) } : {}),
      },
      feeVersion: {
        ...(filters.academicYear ? { academicYear: filters.academicYear } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.campus ? { school: { code: filters.campus } } : {}),
      },
    },
    select: {
      baseFee: true,
      incrementPct: true,
      amount: true,
      updatedAt: true,
      gradeBand: { select: { label: true, order: true } },
      feeHead: { select: { label: true, order: true, isTotal: true, isRemainder: true } },
      feeVersion: {
        select: {
          academicYear: true,
          status: true,
          school: { select: { code: true, name: true, order: true } },
        },
      },
    },
  });

  return lines
    .map((l) => ({
      schoolCode: l.feeVersion.school.code,
      schoolName: l.feeVersion.school.name,
      academicYear: l.feeVersion.academicYear,
      versionStatus: l.feeVersion.status,
      gradeBand: l.gradeBand.label,
      feeHead: l.feeHead.label,
      isTotal: l.feeHead.isTotal,
      isRemainder: l.feeHead.isRemainder,
      baseFee: l.baseFee,
      incrementPct: Number(l.incrementPct),
      amount: l.amount,
      updatedAt: l.updatedAt,
      _schoolOrder: l.feeVersion.school.order,
      _gradeBandOrder: l.gradeBand.order,
      _feeHeadOrder: l.feeHead.order,
    }))
    .sort((a, b) =>
      a._schoolOrder - b._schoolOrder ||
      b.academicYear.localeCompare(a.academicYear) ||
      a._gradeBandOrder - b._gradeBandOrder ||
      a._feeHeadOrder - b._feeHeadOrder,
    )
    .map(({ _schoolOrder, _gradeBandOrder, _feeHeadOrder, ...row }) => row);
}

async function campusOptions(): Promise<ReportFilterOption[]> {
  const schools = await prisma.school.findMany({ orderBy: { order: 'asc' }, select: { code: true, name: true } });
  return schools.map((s) => ({ value: s.code, label: `${s.code} — ${s.name}` }));
}

async function academicYearOptions(): Promise<ReportFilterOption[]> {
  const versions = await prisma.feeVersion.findMany({ distinct: ['academicYear'], select: { academicYear: true } });
  return [...new Set(versions.map((v) => v.academicYear))].sort().reverse().map((y) => ({ value: y, label: y }));
}

export async function getFeeLinesFilterFields(): Promise<ReportFilterField[]> {
  const [campuses, years] = await Promise.all([campusOptions(), academicYearOptions()]);
  return [
    { type: 'daterange', dateLabel: 'Last updated' },
    { type: 'select', key: 'academicYear', label: 'Academic year', options: years },
    { type: 'select', key: 'campus', label: 'Campus', options: campuses },
    { type: 'select', key: 'status', label: 'Status', options: FEE_VERSION_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') })) },
  ];
}

export const FEE_LINES_COLUMNS: ReportColumn<FeeLineReportRow>[] = [
  { key: 'schoolCode', label: 'Campus', get: (r) => r.schoolCode },
  { key: 'academicYear', label: 'Academic Year', get: (r) => r.academicYear },
  { key: 'versionStatus', label: 'Status', get: (r) => r.versionStatus.replace('_', ' ') },
  { key: 'gradeBand', label: 'Grade Band', get: (r) => r.gradeBand },
  { key: 'feeHead', label: 'Fee Head', get: (r) => r.feeHead },
  { key: 'baseFee', label: 'Base Fee (₹)', get: (r) => r.baseFee },
  { key: 'incrementPct', label: 'Increment %', get: (r) => `${Number((r.incrementPct * 100).toFixed(2))}%` },
  { key: 'amount', label: 'Amount (₹)', get: (r) => r.amount },
  { key: 'updatedAt', label: 'Last Updated', get: (r) => r.updatedAt.toISOString().slice(0, 10) },
];
