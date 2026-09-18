'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { assertIsRightsAdmin } from '@/lib/auth/rights';
import { getCurrentUser } from '@/lib/auth/session';
import { SCHOOL_CODES } from '@/lib/school-config';
import type { FeeRole } from '@/engine/rights';

const VALID_ROLES: FeeRole[] = ['SCHOOL_FINANCE', 'FEES_GROUP_COORDINATOR', 'HEAD_OF_OPERATIONS', 'DIRECTOR', 'BOARD_TRUSTEE'];

function parseCampus(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? '').trim();
  return value === '' ? null : value;
}

export async function addRightsGrant(formData: FormData): Promise<void> {
  await assertIsRightsAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const role = String(formData.get('role') ?? '') as FeeRole;
  const campus = parseCampus(formData.get('campus'));
  if (!email || !name || !VALID_ROLES.includes(role)) return;
  if (campus !== null && !SCHOOL_CODES.includes(campus)) return;
  // The four approval-chain roles act across every school — force campus-wide even if the form
  // somehow submitted one, so the grant behaves the way the role description promises.
  const effectiveCampus = role === 'SCHOOL_FINANCE' ? campus : null;

  const admin = await getCurrentUser();
  const user = await prisma.appUser.upsert({
    where: { email },
    create: { email, name },
    update: { name },
  });

  const existing = await prisma.appUserRight.findFirst({ where: { userId: user.id, role, campus: effectiveCampus } });
  if (!existing) {
    await prisma.appUserRight.create({
      data: { userId: user.id, role, campus: effectiveCampus, grantedBy: admin?.email ?? null },
    });
  }
  revalidatePath('/settings/rights');
}

export async function removeRightsGrant(id: string): Promise<void> {
  await assertIsRightsAdmin();
  await prisma.appUserRight.delete({ where: { id } });
  revalidatePath('/settings/rights');
}
