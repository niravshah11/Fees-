'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { assertIsRightsAdmin } from '@/lib/auth/rights';

const CODE_PATTERN = /^[A-Z0-9]{2,10}$/;

/** Adds a brand-new campus — rights-admin only, same gate as /settings/rights, since this is a
 *  rare structural change, not routine day-to-day drafting. `code` becomes the campus's URL slug
 *  (/schools/[code], /master/[code]) and can never be changed afterward, so it's validated up
 *  front. Starts with no programme stages, grade bands, or fee heads — those get set up on the
 *  new campus's own Master data page, same as any other school. */
export async function createSchool(formData: FormData): Promise<void> {
  await assertIsRightsAdmin();

  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  const name = String(formData.get('name') ?? '').trim();
  const board = String(formData.get('board') ?? '').trim();
  const domain = String(formData.get('domain') ?? '').trim().toLowerCase();
  if (!name || !board) return;
  if (!CODE_PATTERN.test(code)) {
    throw new Error('Code must be 2-10 letters/digits (e.g. "FNEW") — it becomes this campus\'s URL and can\'t be changed later.');
  }

  const existing = await prisma.school.findUnique({ where: { code } });
  if (existing) throw new Error(`A school with code "${code}" already exists.`);

  const count = await prisma.school.count();
  await prisma.school.create({ data: { code, name, board, domain, order: count } });
  revalidatePath('/master');
  revalidatePath('/');
  revalidatePath('/settings/rights');
}

/** Edits a campus's display details — rights-admin only. `code` is immutable (see createSchool),
 *  so only name/board/domain ever change here. */
export async function updateSchool(schoolCode: string, formData: FormData): Promise<void> {
  await assertIsRightsAdmin();

  const school = await prisma.school.findUnique({ where: { code: schoolCode } });
  if (!school) throw new Error(`Unknown school code: ${schoolCode}`);

  const name = String(formData.get('name') ?? '').trim();
  const board = String(formData.get('board') ?? '').trim();
  const domain = String(formData.get('domain') ?? '').trim().toLowerCase();
  if (!name || !board) return;

  await prisma.school.update({ where: { id: school.id }, data: { name, board, domain } });
  revalidatePath('/master');
  revalidatePath(`/master/${schoolCode}`);
  revalidatePath(`/schools/${schoolCode}`);
  revalidatePath('/settings/rights');
}

/** Refuses to delete a campus that already has any real data — programme stages, grade bands, fee
 *  heads, fee versions, or uploaded fee-policy PDFs — since School's relations all cascade-delete,
 *  and a careless delete would silently wipe a real campus's whole fee history. Only a genuinely
 *  empty, just-created campus (nothing set up yet) can be removed this way — rights-admin only. */
export async function deleteSchool(schoolCode: string): Promise<void> {
  await assertIsRightsAdmin();

  const school = await prisma.school.findUnique({
    where: { code: schoolCode },
    include: {
      _count: { select: { programmeStages: true, gradeBands: true, feeHeads: true, feeVersions: true, feePolicies: true } },
    },
  });
  if (!school) throw new Error(`Unknown school code: ${schoolCode}`);

  const { programmeStages, gradeBands, feeHeads, feeVersions, feePolicies } = school._count;
  if (programmeStages + gradeBands + feeHeads + feeVersions + feePolicies > 0) {
    throw new Error(
      `Cannot remove "${school.code}" — it already has programme stages, grade bands, fee heads, fee versions, or fee policy documents. Only an empty, just-created campus can be removed this way.`,
    );
  }

  await prisma.school.delete({ where: { id: school.id } });
  revalidatePath('/master');
  revalidatePath('/');
  revalidatePath('/settings/rights');
}
