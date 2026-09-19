// Demo/dev seed. Idempotent (deleteMany() cleanup first, then insert) — same pattern as the
// event-management app's prisma/seed.ts. Run with `npm run seed`.
//
// FSK and FSM figures are real, taken from the two workbooks the user supplied:
//   - "Tuition Fees Working 2024-25, 2025-26 and 2026-27.xlsx" (FSK's approved 2026-27 fee)
//   - "Provisional fee 2027-28.xlsx", sheets "10 Years Fees Kunkni" / "10 Years Fees Malgama"
// FSK's tuitionFee is the ENGINE-COMPUTED value (base x 1.05, rounded) rather than the exact
// filed rupee amount — the original filing's per-grade percentage varied by a few rupees'
// worth of legacy rounding that a flat 5% doesn't reproduce exactly (off by 2-4 rupees on some
// rows).
// FWGS/FPV/FPA/FALH have no source data in either workbook — every figure for them is a
// clearly-labelled placeholder for the finance team to replace via the Fee Builder.
//
// Every school charges Tuition Fee, seeded with real base figures where the user supplied them.
// FeeHead is otherwise campus-specific and extensible via Master Data (confirmed with the user)
// — FSK and FSM also charge a "Beyond Mandate" fee and a "Total Fees to be charged from Parents"
// head. Total is flagged isTotal: independently entered on its own base/increment, same as any
// other head — FSK's real figures put it well above Tuition Fee alone (2024-25 actuals include
// Term Fees), so it is NOT derivable from Tuition Fee. Beyond Mandate is flagged isRemainder:
// engine/fee.ts's computeRemainderHeadAmount always CALCULATES it as Total minus every other head
// (confirmed with the user against real FSK figures: Total minus the FRC-approved Tuition Fee).

import { PrismaClient } from '@prisma/client';
import { computeIncrementedFee } from '../engine/fee';
import { buildApprovalChain } from '../engine/approval';

const prisma = new PrismaClient();

/** The one fee head, when present, that's independently entered as this school's grand total —
 *  flagged isTotal: true on creation (see engine-level header comment above). */
const TOTAL_HEAD_LABEL = 'Total Fees to be charged from Parents';
/** The one fee head, when present, whose amount is CALCULATED as Total minus every other head —
 *  flagged isRemainder: true on creation. */
const REMAINDER_HEAD_LABEL = 'Beyond Mandate';

interface GradeBandSeed {
  label: string;
  baseFee: number;
  /** FSK's real "Total Fees to be charged from Parents" figure for this seed's academic year
   *  (2024-25 actuals including Term Fees, carried to 2026-27) — independently entered, not
   *  derived from `baseFee`. Omitted for schools/bands with no real Total Fees figure yet. */
  totalFee?: number;
}

interface StageSeed {
  label: string;
  gradeBands: GradeBandSeed[];
}

interface SchoolSeed {
  code: string;
  name: string;
  board: string;
  domain: string;
  order: number;
  stages: StageSeed[];
  /** fee heads this school charges, in display order — only the first gets real baseFee data
   *  (from `stages[].gradeBands[].baseFee`); any additional heads seed with a 0 base per grade
   *  band, ready to be filled in via the Fee Builder. */
  feeHeads: string[];
  academicYear: string;
  /** the increment % actually applied to build this seed's FeeVersion's primary-head FeeLines */
  appliedIncrementPct: number;
  versionStatus: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED';
  versionNotes: string;
}

const SCHOOLS: SchoolSeed[] = [
  {
    code: 'FSK',
    name: 'Fountainhead School, Kunkni',
    board: 'IB',
    domain: 'fsksurat.in',
    order: 0,
    feeHeads: ['Total Fees to be charged from Parents', 'Tuition Fee', 'Beyond Mandate'],
    academicYear: '2026-27',
    appliedIncrementPct: 0.05, // historical FRC increase actually applied 2025-26 -> 2026-27
    versionStatus: 'APPROVED',
    versionNotes:
      'FRC-approved 2026-27 Tuition Fee (Tuition Fees Working 2024-25, 2025-26 and 2026-27.xlsx). ' +
      'Figures are the app-computed 5% increment off the 2025-26 base and may differ by a few ' +
      'rupees from the exact filed amount due to legacy per-row rounding in the original FRC ' +
      'filing. "Total Fees to be charged from Parents" is a real, independently-tracked figure ' +
      '(2024-25 actuals including Term Fees, carried to 2026-27) — not derived from Tuition Fee. ' +
      '"Beyond Mandate" is calculated as Total Fees minus Tuition Fee.',
    stages: [
      // Split one stage per IB programme (confirmed with the user) rather than one "EYP to
      // MYP" stage covering three grade bands — each programme sets its own YoY % independently
      // at finalisation time, decided fresh in the Fee Builder each year (no stored default).
      { label: 'EYP — Early Years Programme', gradeBands: [{ label: 'Jr. & Sr. KG', baseFee: 138190, totalFee: 184789 }] },
      { label: 'PYP — Primary Years Programme', gradeBands: [{ label: 'Grade 1 to 6', baseFee: 163640, totalFee: 218826 }] },
      { label: 'MYP — Middle Years Programme', gradeBands: [{ label: 'Grade 7 to 10', baseFee: 202720, totalFee: 271079 }] },
      { label: 'DP — Diploma Programme', gradeBands: [{ label: 'Grade 11 & 12', baseFee: 381470, totalFee: 460256 }] },
    ],
  },
  {
    code: 'FSM',
    name: 'Fountainhead School, Malgama',
    board: 'IB',
    domain: 'fsmsurat.in',
    feeHeads: ['Total Fees to be charged from Parents', 'Tuition Fee', 'Beyond Mandate'],
    order: 1,
    academicYear: '2027-28',
    appliedIncrementPct: 0, // this IS the base year (Parent Undertaking anchor) — no prior year
    versionStatus: 'PENDING_APPROVAL',
    versionNotes:
      'Base fee per the Parent Undertaking for 2027-28 (Provisional fee 2027-28.xlsx, ' +
      '"10 Years Fees Malgama"). Lump-sum tuition figure, no separate term fee. Fees Group ' +
      'Coordinator and Head of Operations have reviewed; awaiting Director and Board of ' +
      'Trustees sign-off. "Total Fees to be charged from Parents" and "Beyond Mandate" (calculated ' +
      'as Total minus Tuition Fee) added per the same structure as FSK — no real Total Fees figure ' +
      'for FSM yet, so Total seeds at 0 until the finance team fills it in via the Fee Builder.',
    stages: [
      {
        label: 'EYP & PYP',
        gradeBands: [
          { label: 'Jr. & Sr. KG', baseFee: 378000 },
          { label: 'Grade 1 to 3', baseFee: 432000 },
          { label: 'Grade 4 to 6', baseFee: 459000 },
        ],
      },
      {
        label: 'MYP & DP',
        gradeBands: [
          { label: 'Grade 7 & 8', baseFee: 486000 },
          { label: 'Grade 9 & 10', baseFee: 540000 },
          { label: 'Grade 11 & 12', baseFee: 594000 },
        ],
      },
    ],
  },
  {
    code: 'FWGS',
    name: 'Fountainhead Workhardt Global School',
    board: 'IB',
    domain: 'fwgs.in',
    feeHeads: ['Tuition Fee'],
    order: 2,
    academicYear: '2027-28',
    appliedIncrementPct: 0, // AY 2027-28 is Year 1 of the 5-year table — the anchor, not an increment
    versionStatus: 'DRAFT',
    versionNotes:
      'AY 2027-28 (Year 1) figures per the FWGS 5-year IB Programme fee table supplied by the ' +
      'user (2026-09-18). Each programme is its own stage — unlike FSK/FSM, FWGS groups every ' +
      'grade band 1:1 with its IB programme, and all four grow at a flat 10% YoY (Year 1 -> ' +
      'Year 5 in the source table: EYP 165000->241577, PYP 264000->386522, MYP 319000->467048, ' +
      'DP 418000->611994 — each ratio is 1.10). Still a draft — not yet submitted for review.',
    stages: [
      { label: 'EYP — Early Years Programme', gradeBands: [{ label: 'Early Years', baseFee: 165000 }] },
      { label: 'PYP — Primary Years Programme', gradeBands: [{ label: 'Primary Years', baseFee: 264000 }] },
      { label: 'MYP — Middle Years Programme', gradeBands: [{ label: 'Middle Years', baseFee: 319000 }] },
      { label: 'DP — Diploma Programme', gradeBands: [{ label: 'Diploma Programme', baseFee: 418000 }] },
    ],
  },
  {
    code: 'FALH',
    name: 'Fountainhead Avadh Learning Hub',
    board: 'IB',
    domain: 'falh.in',
    feeHeads: ['Tuition Fee'],
    order: 3,
    academicYear: '2027-28',
    appliedIncrementPct: 0,
    versionStatus: 'DRAFT',
    versionNotes: 'PLACEHOLDER — no source figures supplied; replace via the Fee Builder before submitting.',
    stages: [
      {
        label: 'EYP to MYP',
        gradeBands: [
          { label: 'Jr. & Sr. KG', baseFee: 125000 },
          { label: 'Grade 1 to 6', baseFee: 148000 },
          { label: 'Grade 7 to 10', baseFee: 185000 },
        ],
      },
      { label: 'DP', gradeBands: [{ label: 'Grade 11 & 12', baseFee: 360000 }] },
    ],
  },
  {
    code: 'FPV',
    name: 'Fountainhead Pre-School, Vesu',
    board: 'IB',
    domain: 'fpvesu.in',
    feeHeads: ['Tuition Fee'],
    order: 4,
    academicYear: '2027-28',
    appliedIncrementPct: 0,
    versionStatus: 'DRAFT',
    versionNotes: 'PLACEHOLDER — no source figures supplied; replace via the Fee Builder before submitting.',
    stages: [
      {
        label: 'Early Years',
        gradeBands: [
          { label: 'Playgroup', baseFee: 95000 },
          { label: 'Nursery', baseFee: 105000 },
          { label: 'Jr. & Sr. KG', baseFee: 115000 },
        ],
      },
    ],
  },
  {
    code: 'FPA',
    name: 'Fountainhead Pre-School, Adajan',
    board: 'IB',
    domain: 'fpadajan.in',
    feeHeads: ['Tuition Fee'],
    order: 5,
    academicYear: '2027-28',
    appliedIncrementPct: 0,
    versionStatus: 'DRAFT',
    versionNotes: 'PLACEHOLDER — no source figures supplied; replace via the Fee Builder before submitting.',
    stages: [
      {
        label: 'Early Years',
        gradeBands: [
          { label: 'Playgroup', baseFee: 90000 },
          { label: 'Nursery', baseFee: 100000 },
          { label: 'Jr. & Sr. KG', baseFee: 110000 },
        ],
      },
    ],
  },
];

async function main() {
  console.log('Clearing existing data...');
  await prisma.feeApproval.deleteMany();
  await prisma.feeLine.deleteMany();
  await prisma.feeVersion.deleteMany();
  await prisma.gradeBand.deleteMany();
  await prisma.programmeStage.deleteMany();
  await prisma.feeHead.deleteMany();
  await prisma.school.deleteMany();
  await prisma.appUserRight.deleteMany();
  await prisma.appUser.deleteMany();

  for (const s of SCHOOLS) {
    const school = await prisma.school.create({
      data: { code: s.code, name: s.name, board: s.board, domain: s.domain, order: s.order },
    });

    const feeHeads = await Promise.all(
      s.feeHeads.map((label, order) =>
        prisma.feeHead.create({
          data: {
            schoolId: school.id,
            label,
            order,
            isTotal: label === TOTAL_HEAD_LABEL,
            isRemainder: label === REMAINDER_HEAD_LABEL,
          },
        }),
      ),
    );
    // Tuition Fee carries the real source-workbook base figures; the isTotal head (if present)
    // carries its own real base (GradeBandSeed.totalFee) where the user supplied one, else 0.
    // Every other non-remainder head seeds at 0, ready to be filled in via the Fee Builder. The
    // isRemainder head's own baseFee/amount are computed AFTER every other head's line exists for
    // this grade band (see below) — never read for display, but kept accurate for anything that
    // inspects the raw row directly.
    const realDataHead = feeHeads.find((h) => h.label === 'Tuition Fee') ?? feeHeads[0];
    const totalHead = feeHeads.find((h) => h.isTotal);
    const remainderHead = feeHeads.find((h) => h.isRemainder);

    const feeVersion = await prisma.feeVersion.create({
      data: {
        schoolId: school.id,
        academicYear: s.academicYear,
        status: s.versionStatus,
        createdBy: `finance@${s.domain}`,
        submittedAt: s.versionStatus === 'DRAFT' ? null : new Date(),
        notes: s.versionNotes,
      },
    });

    let stageOrder = 0;
    let bandOrder = 0;
    for (const stage of s.stages) {
      const programmeStage = await prisma.programmeStage.create({
        data: {
          schoolId: school.id,
          label: stage.label,
          order: stageOrder++,
        },
      });

      for (const band of stage.gradeBands) {
        const gradeBand = await prisma.gradeBand.create({
          data: {
            schoolId: school.id,
            programmeStageId: programmeStage.id,
            label: band.label,
            order: bandOrder++,
          },
        });

        // One FeeLine per (grade band x fee head). Tuition Fee gets the real source-workbook
        // base; the isTotal head (if present) gets its own real, independently-tracked base
        // (GradeBandSeed.totalFee) at 0% — a fresh increment is set later via the Fee Builder,
        // same as any other head. Any other non-remainder head seeds at 0. The isRemainder head
        // is skipped here and computed afterward as Total minus every other head's amount.
        const amountByHeadId = new Map<string, number>();
        for (const head of feeHeads) {
          if (head.isRemainder) continue;
          let baseFee = 0;
          let incrementPct = 0;
          if (head.id === realDataHead.id) {
            baseFee = band.baseFee;
            incrementPct = s.appliedIncrementPct;
          } else if (head.isTotal && band.totalFee !== undefined) {
            baseFee = band.totalFee;
          }
          const amount = computeIncrementedFee(baseFee, incrementPct);
          amountByHeadId.set(head.id, amount);

          await prisma.feeLine.create({
            data: {
              feeVersionId: feeVersion.id,
              gradeBandId: gradeBand.id,
              feeHeadId: head.id,
              baseFee,
              incrementPct,
              amount,
            },
          });
        }

        if (remainderHead) {
          const totalAmount = totalHead ? amountByHeadId.get(totalHead.id) ?? 0 : 0;
          const othersSum = [...amountByHeadId.entries()]
            .filter(([id]) => id !== totalHead?.id)
            .reduce((sum, [, amt]) => sum + amt, 0);
          const remainderAmount = totalAmount - othersSum;

          await prisma.feeLine.create({
            data: {
              feeVersionId: feeVersion.id,
              gradeBandId: gradeBand.id,
              feeHeadId: remainderHead.id,
              baseFee: remainderAmount,
              incrementPct: 0,
              amount: remainderAmount,
            },
          });
        }
      }
    }

    // A PENDING_APPROVAL demo sits mid-chain (Fees Group Coordinator + Head of Operations already
    // decided, Director next actionable) rather than at step 1, so the seed shows what more than
    // one decision in looks like.
    const DECIDER_EMAIL: Record<string, string> = {
      FEES_GROUP_COORDINATOR: 'coordinator@fountainheadschools.org',
      HEAD_OF_OPERATIONS: 'nirav.shah@fountainheadschools.org',
      DIRECTOR: 'director@fountainheadschools.org',
      BOARD_TRUSTEE: 'board.trustee@fountainheadschools.org',
    };
    if (s.versionStatus !== 'DRAFT') {
      const chain = buildApprovalChain();
      for (const step of chain) {
        const decidedMidChain =
          s.versionStatus === 'PENDING_APPROVAL' &&
          (step.role === 'FEES_GROUP_COORDINATOR' || step.role === 'HEAD_OF_OPERATIONS');
        const alreadyApprovedFully = s.versionStatus === 'APPROVED';
        const isDecided = decidedMidChain || alreadyApprovedFully;
        await prisma.feeApproval.create({
          data: {
            feeVersionId: feeVersion.id,
            role: step.role,
            label: step.label,
            order: step.order,
            status: isDecided ? 'APPROVED' : 'PENDING',
            decidedBy: isDecided ? DECIDER_EMAIL[step.role] : null,
            decidedAt: isDecided ? new Date() : null,
          },
        });
      }
    }

    console.log(`Seeded ${s.code}: ${s.stages.reduce((n, st) => n + st.gradeBands.length, 0)} grade bands, FeeVersion ${s.academicYear} (${s.versionStatus}).`);
  }

  // Demo users for the four approval-chain roles — drafting/editing itself needs no grant at all
  // (open to every signed-in colleague). Nirav Shah really is the group's Head of Operations, so
  // he's seeded with exactly that role — he's also the rights admin by default
  // (lib/auth/rights-admins.ts), which is an independent, separate capability: curating the
  // rights list doesn't require personally holding every approval-chain role.
  const roleUsers: Array<{ email: string; name: string; role: string }> = [
    { email: 'coordinator@fountainheadschools.org', name: 'Fees Group Coordinator', role: 'FEES_GROUP_COORDINATOR' },
    { email: 'nirav.shah@fountainheadschools.org', name: 'Nirav Shah', role: 'HEAD_OF_OPERATIONS' },
    { email: 'director@fountainheadschools.org', name: 'Director', role: 'DIRECTOR' },
    { email: 'board.trustee@fountainheadschools.org', name: 'Board of Trustees', role: 'BOARD_TRUSTEE' },
  ];
  for (const ru of roleUsers) {
    const user = await prisma.appUser.create({ data: { email: ru.email, name: ru.name } });
    await prisma.appUserRight.create({ data: { userId: user.id, role: ru.role, campus: null } });
  }

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
