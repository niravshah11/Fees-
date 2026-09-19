import 'server-only';
import { prisma } from './db';
import { computeIncrementedFee } from '../engine/fee';

/** Creates one DRAFT FeeVersion for `schoolId` for `academicYear` — one FeeLine per (grade band x
 *  fee head), pre-filled from the school's latest APPROVED version (baseFee = that head's prior
 *  amount for that grade band) at a 0% increment, exactly as engine/fee.ts's header describes.
 *  Returns null and does nothing if the school has no grade bands or fee heads yet. Shared between
 *  the per-school "Start next year's proposal" action and the Dashboard's bulk one, so the two
 *  can never drift apart. */
export async function createDraftVersionForSchool(
  schoolId: string,
  academicYear: string,
  createdBy: string | null,
): Promise<{ id: string } | null> {
  const [gradeBands, feeHeads] = await Promise.all([
    prisma.gradeBand.findMany({ where: { schoolId }, orderBy: { order: 'asc' } }),
    prisma.feeHead.findMany({ where: { schoolId }, orderBy: { order: 'asc' } }),
  ]);
  if (gradeBands.length === 0 || feeHeads.length === 0) return null;

  const lastApproved = await prisma.feeVersion.findFirst({
    where: { schoolId, status: 'APPROVED' },
    orderBy: { academicYear: 'desc' },
    include: { feeLines: true },
  });

  const draft = await prisma.feeVersion.create({
    data: { schoolId, academicYear, status: 'DRAFT', createdBy },
  });

  for (const band of gradeBands) {
    for (const head of feeHeads) {
      const priorLine = lastApproved?.feeLines.find((l) => l.gradeBandId === band.id && l.feeHeadId === head.id);
      const baseFee = priorLine?.amount ?? 0;
      // No stored default to inherit — the increment is a fresh decision every year, set here
      // via per-line edits or "bulk apply" once the draft exists.
      const incrementPct = 0;
      const amount = computeIncrementedFee(baseFee, incrementPct);

      await prisma.feeLine.create({
        data: { feeVersionId: draft.id, gradeBandId: band.id, feeHeadId: head.id, baseFee, incrementPct, amount },
      });
    }
  }

  return draft;
}
