// Demo/dev seed. Idempotent (deleteMany() cleanup first, then insert) — same pattern as the
// event-management app's prisma/seed.ts. Run with `npm run seed`.
//
// FSK and FSM figures are real, taken from the two workbooks the user supplied:
//   - "Tuition Fees Working 2024-25, 2025-26 and 2026-27.xlsx" (FSK's approved 2026-27 fee)
//   - "Provisional fee 2027-28.xlsx", sheets "10 Years Fees Kunkni" / "10 Years Fees Malgama"
// FSK's tuitionFee is the ENGINE-COMPUTED value (base x 1.05, rounded) rather than the exact
// filed rupee amount — the original filing's per-grade percentage varied by a few rupees'
// worth of legacy rounding that a flat 5% doesn't reproduce exactly (off by 2-4 rupees on some
// rows). termFee amounts, which the app treats as an editable input rather than a formula, ARE
// the exact filed figures (10% Working with Term fees!E19:E22, 2026-27 block).
// FWGS/FPV/FPA/FALH have no source data in either workbook — every figure for them is a
// clearly-labelled placeholder for the finance team to replace via the Fee Builder.

import { PrismaClient } from '@prisma/client';
import { computeIncrementedFee, computeTotalFee } from '../engine/fee';
import { buildApprovalChain } from '../engine/approval';

const prisma = new PrismaClient();

interface GradeBandSeed {
  label: string;
  baseFee: number;
  termFee?: number;
}

interface StageSeed {
  label: string;
  defaultIncrementPct: number;
  gradeBands: GradeBandSeed[];
}

interface SchoolSeed {
  code: string;
  name: string;
  board: string;
  domain: string;
  order: number;
  stages: StageSeed[];
  academicYear: string;
  /** the increment % actually applied to build this seed's FeeVersion (may differ from a
   *  stage's forward-looking defaultIncrementPct — see FSK's note below) */
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
    academicYear: '2026-27',
    appliedIncrementPct: 0.05, // historical FRC increase actually applied 2025-26 -> 2026-27
    versionStatus: 'APPROVED',
    versionNotes:
      'FRC-approved 2026-27 fee (Tuition Fees Working 2024-25, 2025-26 and 2026-27.xlsx). ' +
      'Tuition figures are the app-computed 5% increment off the 2025-26 base and may differ ' +
      'by a few rupees from the exact filed amount due to legacy per-row rounding in the ' +
      'original FRC filing. Term fees are the exact filed amounts.',
    stages: [
      {
        // Forward-looking policy (10 Years Fees Kunkni!E1:F2): 6% for EYP-to-MYP from 2027-28
        // onward. The 2026-27 seed above still uses the historical 5% — this default only
        // pre-fills the NEXT draft a School Finance user creates.
        label: 'EYP to MYP',
        defaultIncrementPct: 0.06,
        gradeBands: [
          { label: 'Jr. & Sr. KG', baseFee: 138190, termFee: 20157 },
          { label: 'Grade 1 to 6', baseFee: 163640, termFee: 23870 },
          { label: 'Grade 7 to 10', baseFee: 202720, termFee: 29570 },
        ],
      },
      {
        label: 'DP',
        defaultIncrementPct: 0.05,
        gradeBands: [{ label: 'Grade 11 & 12', baseFee: 381470, termFee: 55644 }],
      },
    ],
  },
  {
    code: 'FSM',
    name: 'Fountainhead School, Malgama',
    board: 'IB',
    domain: 'fsmsurat.in',
    order: 1,
    academicYear: '2027-28',
    appliedIncrementPct: 0, // this IS the base year (Parent Undertaking anchor) — no prior year
    versionStatus: 'PENDING_APPROVAL',
    versionNotes:
      'Base fee per the Parent Undertaking for 2027-28 (Provisional fee 2027-28.xlsx, ' +
      '"10 Years Fees Malgama"). Lump-sum tuition figure, no separate term fee. Fees Group ' +
      'Coordinator and Head of Operations have reviewed; awaiting Director and Board of ' +
      'Trustees sign-off.',
    stages: [
      {
        label: 'EYP & PYP',
        defaultIncrementPct: 0.09,
        gradeBands: [
          { label: 'Jr. & Sr. KG', baseFee: 378000 },
          { label: 'Grade 1 to 3', baseFee: 432000 },
          { label: 'Grade 4 to 6', baseFee: 459000 },
        ],
      },
      {
        label: 'MYP & DP',
        defaultIncrementPct: 0.08,
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
      { label: 'EYP — Early Years Programme', defaultIncrementPct: 0.1, gradeBands: [{ label: 'Early Years', baseFee: 165000 }] },
      { label: 'PYP — Primary Years Programme', defaultIncrementPct: 0.1, gradeBands: [{ label: 'Primary Years', baseFee: 264000 }] },
      { label: 'MYP — Middle Years Programme', defaultIncrementPct: 0.1, gradeBands: [{ label: 'Middle Years', baseFee: 319000 }] },
      { label: 'DP — Diploma Programme', defaultIncrementPct: 0.1, gradeBands: [{ label: 'Diploma Programme', baseFee: 418000 }] },
    ],
  },
  {
    code: 'FALH',
    name: 'Fountainhead Avadh Learning Hub',
    board: 'IB',
    domain: 'falh.in',
    order: 3,
    academicYear: '2027-28',
    appliedIncrementPct: 0,
    versionStatus: 'DRAFT',
    versionNotes: 'PLACEHOLDER — no source figures supplied; replace via the Fee Builder before submitting.',
    stages: [
      {
        label: 'EYP to MYP',
        defaultIncrementPct: 0.06,
        gradeBands: [
          { label: 'Jr. & Sr. KG', baseFee: 125000 },
          { label: 'Grade 1 to 6', baseFee: 148000 },
          { label: 'Grade 7 to 10', baseFee: 185000 },
        ],
      },
      { label: 'DP', defaultIncrementPct: 0.05, gradeBands: [{ label: 'Grade 11 & 12', baseFee: 360000 }] },
    ],
  },
  {
    code: 'FPV',
    name: 'Fountainhead Pre-School, Vesu',
    board: 'IB',
    domain: 'fpvesu.in',
    order: 4,
    academicYear: '2027-28',
    appliedIncrementPct: 0,
    versionStatus: 'DRAFT',
    versionNotes: 'PLACEHOLDER — no source figures supplied; replace via the Fee Builder before submitting.',
    stages: [
      {
        label: 'Early Years',
        defaultIncrementPct: 0.08,
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
    order: 5,
    academicYear: '2027-28',
    appliedIncrementPct: 0,
    versionStatus: 'DRAFT',
    versionNotes: 'PLACEHOLDER — no source figures supplied; replace via the Fee Builder before submitting.',
    stages: [
      {
        label: 'Early Years',
        defaultIncrementPct: 0.08,
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
  await prisma.school.deleteMany();
  await prisma.appUserRight.deleteMany();
  await prisma.appUser.deleteMany();

  for (const s of SCHOOLS) {
    const school = await prisma.school.create({
      data: { code: s.code, name: s.name, board: s.board, domain: s.domain, order: s.order },
    });

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
          defaultIncrementPct: stage.defaultIncrementPct,
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

        const tuitionFee = computeIncrementedFee(band.baseFee, s.appliedIncrementPct);
        const termFee = band.termFee ?? 0;
        const totalFee = computeTotalFee(tuitionFee, termFee, 0);

        await prisma.feeLine.create({
          data: {
            feeVersionId: feeVersion.id,
            gradeBandId: gradeBand.id,
            baseFee: band.baseFee,
            incrementPct: s.appliedIncrementPct,
            tuitionFee,
            termFee,
            admissionFee: 0,
            totalFee,
          },
        });
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

  // Demo users, one per workflow role. Nirav Shah really is the group's Head of Operations, so
  // he's seeded with exactly that role (not all four/five, and not none) — he's also the rights
  // admin by default (lib/auth/rights-admins.ts), which is an independent, separate capability:
  // curating the rights list doesn't require personally holding every workflow role.
  const roleUsers: Array<{ email: string; name: string; role: string }> = [
    { email: 'coordinator@fountainheadschools.org', name: 'Fees Group Coordinator', role: 'FEES_GROUP_COORDINATOR' },
    { email: 'nirav.shah@fountainheadschools.org', name: 'Nirav Shah', role: 'HEAD_OF_OPERATIONS' },
    { email: 'director@fountainheadschools.org', name: 'Director', role: 'DIRECTOR' },
    { email: 'board.trustee@fountainheadschools.org', name: 'Board of Trustees', role: 'BOARD_TRUSTEE' },
    { email: 'finance@fsksurat.in', name: 'FSK Finance Officer', role: 'SCHOOL_FINANCE' },
    { email: 'finance@fsmsurat.in', name: 'FSM Finance Officer', role: 'SCHOOL_FINANCE' },
  ];
  for (const ru of roleUsers) {
    const user = await prisma.appUser.create({ data: { email: ru.email, name: ru.name } });
    const campus = ru.role === 'SCHOOL_FINANCE' ? SCHOOLS.find((s) => `finance@${s.domain}` === ru.email)?.code ?? null : null;
    await prisma.appUserRight.create({ data: { userId: user.id, role: ru.role, campus } });
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
