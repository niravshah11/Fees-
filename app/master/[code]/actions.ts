'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { computeIncrementedFee } from '@/engine/fee';

// Master-data mutations for a school's Programme Stages, Grade Bands, and Fee Heads. Open to
// every signed-in colleague, same as drafting a fee proposal — there is no dedicated "editor"
// role (confirmed with the user); only the approval chain itself is role-gated.

async function requireSchool(code: string) {
  const school = await prisma.school.findUnique({ where: { code } });
  if (!school) throw new Error(`Unknown school code: ${code}`);
  return school;
}

export async function createProgrammeStage(schoolCode: string, formData: FormData): Promise<void> {
  const school = await requireSchool(schoolCode);
  const label = String(formData.get('label') ?? '').trim();
  if (!label) return;

  const count = await prisma.programmeStage.count({ where: { schoolId: school.id } });
  await prisma.programmeStage.create({
    data: { schoolId: school.id, label, order: count },
  });
  revalidatePath(`/master/${schoolCode}`);
}

export async function updateProgrammeStage(schoolCode: string, stageId: string, formData: FormData): Promise<void> {
  const school = await requireSchool(schoolCode);
  const stage = await prisma.programmeStage.findUnique({ where: { id: stageId } });
  if (!stage || stage.schoolId !== school.id) throw new Error('Programme stage not found for this school.');

  const label = String(formData.get('label') ?? '').trim();
  if (!label) return;

  await prisma.programmeStage.update({ where: { id: stageId }, data: { label } });
  revalidatePath(`/master/${schoolCode}`);
}

/** Refuses to delete a stage that still has grade bands under it — force an explicit decision
 *  about each band (move it to another stage, or delete it) rather than silently cascading. */
export async function deleteProgrammeStage(schoolCode: string, stageId: string): Promise<void> {
  const school = await requireSchool(schoolCode);
  const stage = await prisma.programmeStage.findUnique({ where: { id: stageId }, include: { gradeBands: true } });
  if (!stage || stage.schoolId !== school.id) throw new Error('Programme stage not found for this school.');
  if (stage.gradeBands.length > 0) {
    throw new Error(`Cannot remove "${stage.label}" — it still has ${stage.gradeBands.length} grade band(s). Move or remove those first.`);
  }

  await prisma.programmeStage.delete({ where: { id: stageId } });
  revalidatePath(`/master/${schoolCode}`);
}

/** Adds one grade band per grade selected in the multi-select picker (STANDARD_GRADES) — e.g.
 *  selecting Grade 7, Grade 8, Grade 9 creates three separate grade bands under the stage, not
 *  one combined "Grade 7 to 9" band. Skips any grade that's already a band for this school. */
export async function createGradeBands(schoolCode: string, stageId: string, formData: FormData): Promise<void> {
  const school = await requireSchool(schoolCode);
  const stage = await prisma.programmeStage.findUnique({ where: { id: stageId } });
  if (!stage || stage.schoolId !== school.id) throw new Error('Programme stage not found for this school.');

  const grades = formData.getAll('grades').map(String).filter(Boolean);
  if (grades.length === 0) return;

  const existing = await prisma.gradeBand.findMany({ where: { schoolId: school.id }, select: { label: true } });
  const existingLabels = new Set(existing.map((b) => b.label));

  let order = await prisma.gradeBand.count({ where: { schoolId: school.id } });
  for (const label of grades) {
    if (existingLabels.has(label)) continue;
    await prisma.gradeBand.create({ data: { schoolId: school.id, programmeStageId: stageId, label, order: order++ } });
  }
  revalidatePath(`/master/${schoolCode}`);
}

export async function updateGradeBand(schoolCode: string, bandId: string, formData: FormData): Promise<void> {
  const school = await requireSchool(schoolCode);
  const band = await prisma.gradeBand.findUnique({ where: { id: bandId } });
  if (!band || band.schoolId !== school.id) throw new Error('Grade band not found for this school.');

  const label = String(formData.get('label') ?? '').trim();
  const programmeStageId = String(formData.get('programmeStageId') ?? '');
  if (!label || !programmeStageId) return;

  await prisma.gradeBand.update({ where: { id: bandId }, data: { label, programmeStageId } });
  revalidatePath(`/master/${schoolCode}`);
}

/** Refuses to delete a grade band that already has fee-line history (in any FeeVersion, not just
 *  the current draft) — deleting it would cascade-delete those FeeLine rows and silently erase
 *  real fee records. */
export async function deleteGradeBand(schoolCode: string, bandId: string): Promise<void> {
  const school = await requireSchool(schoolCode);
  const band = await prisma.gradeBand.findUnique({ where: { id: bandId } });
  if (!band || band.schoolId !== school.id) throw new Error('Grade band not found for this school.');

  const feeLineCount = await prisma.feeLine.count({ where: { gradeBandId: bandId } });
  if (feeLineCount > 0) {
    throw new Error(`Cannot remove "${band.label}" — it has ${feeLineCount} fee line(s) recorded across fee versions.`);
  }

  await prisma.gradeBand.delete({ where: { id: bandId } });
  revalidatePath(`/master/${schoolCode}`);
}

export async function createFeeHead(schoolCode: string, formData: FormData): Promise<void> {
  const school = await requireSchool(schoolCode);
  const label = String(formData.get('label') ?? '').trim();
  // A head can't be both — Total is independently entered, Remainder is always calculated from it.
  const isTotal = formData.get('isTotal') === 'on';
  const isRemainder = !isTotal && formData.get('isRemainder') === 'on';
  if (!label) return;

  const count = await prisma.feeHead.count({ where: { schoolId: school.id } });
  await prisma.$transaction(async (tx) => {
    // At most one of each per school (see schema.prisma's FeeHead doc comments).
    if (isTotal) await tx.feeHead.updateMany({ where: { schoolId: school.id }, data: { isTotal: false } });
    if (isRemainder) await tx.feeHead.updateMany({ where: { schoolId: school.id }, data: { isRemainder: false } });
    const head = await tx.feeHead.create({ data: { schoolId: school.id, label, order: count, isTotal, isRemainder } });

    // Backfill this new head into any DRAFT proposal already in progress, so it shows up in the
    // Fee Builder right away instead of silently missing until the next draft starts fresh
    // (confirmed with the user: Master Data's fee heads and a school's current draft must never
    // drift out of sync). Not backfilled into PENDING_APPROVAL/APPROVED versions — those are
    // already submitted or final, so their structure shouldn't shift retroactively.
    const draftVersions = await tx.feeVersion.findMany({ where: { schoolId: school.id, status: 'DRAFT' } });
    if (draftVersions.length > 0) {
      const gradeBands = await tx.gradeBand.findMany({ where: { schoolId: school.id } });
      const amount = computeIncrementedFee(0, 0);
      for (const version of draftVersions) {
        for (const band of gradeBands) {
          await tx.feeLine.create({
            data: { feeVersionId: version.id, gradeBandId: band.id, feeHeadId: head.id, baseFee: 0, incrementPct: 0, amount },
          });
        }
      }
    }
  });
  revalidatePath(`/master/${schoolCode}`);
  revalidatePath(`/schools/${schoolCode}`);
}

export async function updateFeeHead(schoolCode: string, headId: string, formData: FormData): Promise<void> {
  const school = await requireSchool(schoolCode);
  const head = await prisma.feeHead.findUnique({ where: { id: headId } });
  if (!head || head.schoolId !== school.id) throw new Error('Fee head not found for this school.');

  const label = String(formData.get('label') ?? '').trim();
  const isTotal = formData.get('isTotal') === 'on';
  const isRemainder = !isTotal && formData.get('isRemainder') === 'on';
  if (!label) return;

  await prisma.$transaction(async (tx) => {
    if (isTotal) await tx.feeHead.updateMany({ where: { schoolId: school.id, id: { not: headId } }, data: { isTotal: false } });
    if (isRemainder) await tx.feeHead.updateMany({ where: { schoolId: school.id, id: { not: headId } }, data: { isRemainder: false } });
    await tx.feeHead.update({ where: { id: headId }, data: { label, isTotal, isRemainder } });
  });
  revalidatePath(`/master/${schoolCode}`);
  revalidatePath(`/schools/${schoolCode}`);
}

/** Refuses to delete a fee head that already has fee-line history — deleting it would
 *  cascade-delete those FeeLine rows and silently erase real fee records. */
export async function deleteFeeHead(schoolCode: string, headId: string): Promise<void> {
  const school = await requireSchool(schoolCode);
  const head = await prisma.feeHead.findUnique({ where: { id: headId } });
  if (!head || head.schoolId !== school.id) throw new Error('Fee head not found for this school.');

  const feeLineCount = await prisma.feeLine.count({ where: { feeHeadId: headId } });
  if (feeLineCount > 0) {
    throw new Error(`Cannot remove "${head.label}" — it has ${feeLineCount} fee line(s) recorded across fee versions.`);
  }

  await prisma.feeHead.delete({ where: { id: headId } });
  revalidatePath(`/master/${schoolCode}`);
}
