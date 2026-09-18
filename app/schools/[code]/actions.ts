'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { assertCanDraftForCampus, assertHasRole } from '@/lib/auth/rights';
import { computeIncrementedFee, computeTotalFee } from '@/engine/fee';
import { buildApprovalChain, computeApprovalState, type ApprovalLike } from '@/engine/approval';
import type { FeeRole } from '@/engine/rights';
import type { ApprovalDecision } from '@/engine/fee';

async function requireSchool(code: string) {
  const school = await prisma.school.findUnique({ where: { code } });
  if (!school) throw new Error(`Unknown school code: ${code}`);
  return school;
}

/** Starts a new DRAFT FeeVersion for the given academic year, one FeeLine per current grade
 *  band, pre-filled from the school's latest APPROVED version (baseFee = that version's tuition
 *  fee) with a 0% increment — the Finance Officer sets the real % for this year via per-line
 *  edits or "bulk apply" once the draft exists. */
export async function createDraftVersion(schoolCode: string, formData: FormData): Promise<void> {
  const school = await requireSchool(schoolCode);
  await assertCanDraftForCampus(school.code);
  const user = await getCurrentUser();

  const academicYear = String(formData.get('academicYear') ?? '').trim();
  if (!academicYear) return;

  const gradeBands = await prisma.gradeBand.findMany({
    where: { schoolId: school.id },
    orderBy: { order: 'asc' },
  });
  if (gradeBands.length === 0) return;

  const lastApproved = await prisma.feeVersion.findFirst({
    where: { schoolId: school.id, status: 'APPROVED' },
    orderBy: { academicYear: 'desc' },
    include: { feeLines: true },
  });

  const draft = await prisma.feeVersion.create({
    data: {
      schoolId: school.id,
      academicYear,
      status: 'DRAFT',
      createdBy: user?.email ?? null,
    },
  });

  for (const band of gradeBands) {
    const priorLine = lastApproved?.feeLines.find((l) => l.gradeBandId === band.id);
    const baseFee = priorLine?.tuitionFee ?? 0;
    // No stored default to inherit — the increment is a fresh decision every year, set here via
    // per-line edits or "bulk apply" once the draft exists (see engine/fee.ts's header).
    const incrementPct = 0;
    const tuitionFee = computeIncrementedFee(baseFee, incrementPct);
    // Term fee and admission fee are retired from the proposal (confirmed with the user) —
    // every line's total is just its tuition fee now.
    const totalFee = computeTotalFee(tuitionFee);

    await prisma.feeLine.create({
      data: {
        feeVersionId: draft.id,
        gradeBandId: band.id,
        baseFee,
        incrementPct,
        tuitionFee,
        termFee: 0,
        admissionFee: 0,
        totalFee,
      },
    });
  }

  revalidatePath(`/schools/${schoolCode}`);
}

export async function updateFeeLine(schoolCode: string, feeLineId: string, formData: FormData): Promise<void> {
  const school = await requireSchool(schoolCode);
  await assertCanDraftForCampus(school.code);

  const line = await prisma.feeLine.findUnique({ where: { id: feeLineId }, include: { feeVersion: true } });
  if (!line || line.feeVersion.schoolId !== school.id) throw new Error('Fee line not found for this school.');
  if (line.feeVersion.status !== 'DRAFT') throw new Error('Only a DRAFT fee version can be edited.');

  const baseFee = Number(formData.get('baseFee'));
  const incrementPctInput = Number(formData.get('incrementPct'));
  const notes = String(formData.get('notes') ?? '').trim() || null;
  if ([baseFee, incrementPctInput].some((n) => Number.isNaN(n))) return;

  const incrementPct = incrementPctInput / 100;
  const tuitionFee = computeIncrementedFee(baseFee, incrementPct);
  // Term fee and admission fee are retired from the proposal (confirmed with the user) — every
  // line's total is just its tuition fee now. The columns stay on FeeLine (always 0 going
  // forward) rather than a schema migration, since it's simple to reintroduce if ever needed.
  const totalFee = computeTotalFee(tuitionFee);

  await prisma.feeLine.update({
    where: { id: feeLineId },
    data: { baseFee, incrementPct, tuitionFee, termFee: 0, admissionFee: 0, totalFee, notes },
  });
  revalidatePath(`/schools/${schoolCode}`);
}

/** Applies one increment % to every fee line in `feeVersionId` whose grade band belongs to
 *  `programmeStageId` — the "bulk apply" convenience for the flexible-per-stage requirement. */
export async function bulkApplyIncrement(schoolCode: string, feeVersionId: string, formData: FormData): Promise<void> {
  const school = await requireSchool(schoolCode);
  await assertCanDraftForCampus(school.code);

  const version = await prisma.feeVersion.findUnique({ where: { id: feeVersionId } });
  if (!version || version.schoolId !== school.id) throw new Error('Fee version not found for this school.');
  if (version.status !== 'DRAFT') throw new Error('Only a DRAFT fee version can be edited.');

  const programmeStageId = String(formData.get('programmeStageId') ?? '');
  const pctInput = Number(formData.get('incrementPct'));
  if (!programmeStageId || Number.isNaN(pctInput)) return;
  const incrementPct = pctInput / 100;

  const lines = await prisma.feeLine.findMany({
    where: { feeVersionId, gradeBand: { programmeStageId } },
  });
  for (const line of lines) {
    const tuitionFee = computeIncrementedFee(line.baseFee, incrementPct);
    const totalFee = computeTotalFee(tuitionFee);
    await prisma.feeLine.update({ where: { id: line.id }, data: { incrementPct, tuitionFee, totalFee, termFee: 0, admissionFee: 0 } });
  }
  revalidatePath(`/schools/${schoolCode}`);
}

export async function submitForReview(schoolCode: string, feeVersionId: string): Promise<void> {
  const school = await requireSchool(schoolCode);
  await assertCanDraftForCampus(school.code);

  const version = await prisma.feeVersion.findUnique({ where: { id: feeVersionId } });
  if (!version || version.schoolId !== school.id) throw new Error('Fee version not found for this school.');
  if (version.status !== 'DRAFT') throw new Error('Only a DRAFT fee version can be submitted.');

  const chain = buildApprovalChain();
  await prisma.$transaction([
    prisma.feeVersion.update({
      where: { id: feeVersionId },
      data: { status: 'PENDING_APPROVAL', submittedAt: new Date() },
    }),
    prisma.feeApproval.createMany({
      data: chain.map((step) => ({ feeVersionId, role: step.role, label: step.label, order: step.order })),
    }),
  ]);
  revalidatePath(`/schools/${schoolCode}`);
}

export async function decideApproval(
  schoolCode: string,
  approvalId: string,
  decision: 'APPROVED' | 'REJECTED',
  formData: FormData,
): Promise<void> {
  const school = await requireSchool(schoolCode);

  const approval = await prisma.feeApproval.findUnique({
    where: { id: approvalId },
    include: { feeVersion: { include: { approvals: true } } },
  });
  if (!approval || approval.feeVersion.schoolId !== school.id) throw new Error('Approval step not found for this school.');

  await assertHasRole(approval.role as FeeRole);

  const approvals = approval.feeVersion.approvals as unknown as ApprovalLike[];
  const state = computeApprovalState(approvals);
  if (state.currentOrder !== approval.order) {
    throw new Error('This step is not currently actionable — a prior step is still pending.');
  }

  const note = String(formData.get('note') ?? '').trim() || null;
  const user = await getCurrentUser();

  const updatedApprovals: ApprovalLike[] = approvals.map((a) =>
    a.order === approval.order ? { ...a, status: decision as ApprovalDecision } : a,
  );
  const nextState = computeApprovalState(updatedApprovals);

  await prisma.$transaction(async (tx) => {
    await tx.feeApproval.update({
      where: { id: approvalId },
      data: { status: decision, decidedBy: user?.email ?? null, decidedAt: new Date(), note },
    });
    await tx.feeVersion.update({ where: { id: approval.feeVersionId }, data: { status: nextState.overall } });

    if (nextState.overall === 'APPROVED') {
      await tx.feeVersion.updateMany({
        where: {
          schoolId: school.id,
          academicYear: approval.feeVersion.academicYear,
          status: 'APPROVED',
          id: { not: approval.feeVersionId },
        },
        data: { status: 'SUPERSEDED' },
      });
    }
  });

  revalidatePath(`/schools/${schoolCode}`);
}
