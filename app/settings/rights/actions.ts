'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { assertIsRightsAdmin } from '@/lib/auth/rights';
import { getCurrentUser } from '@/lib/auth/session';
import type { FeeRole } from '@/engine/rights';

const VALID_ROLES: FeeRole[] = ['FEES_GROUP_COORDINATOR', 'HEAD_OF_OPERATIONS', 'HEAD_OF_FINANCE', 'DIRECTOR', 'BOARD_TRUSTEE'];

function parseCampus(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? '').trim();
  return value === '' ? null : value;
}

/** Campuses are DB-backed and can be added/removed at /master (app/master/actions.ts), so this
 *  checks the live School table rather than a hardcoded list — a newly added campus is
 *  immediately assignable here, no code change needed. */
async function isKnownCampus(campus: string): Promise<boolean> {
  return (await prisma.school.findUnique({ where: { code: campus }, select: { code: true } })) !== null;
}

export async function addRightsGrant(formData: FormData): Promise<void> {
  await assertIsRightsAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const role = String(formData.get('role') ?? '') as FeeRole;
  const campus = parseCampus(formData.get('campus'));
  if (!email || !name || !VALID_ROLES.includes(role)) return;
  if (campus !== null && !(await isKnownCampus(campus))) return;

  const admin = await getCurrentUser();
  const user = await prisma.appUser.upsert({
    where: { email },
    create: { email, name },
    update: { name },
  });

  const existing = await prisma.appUserRight.findFirst({ where: { userId: user.id, role, campus } });
  if (!existing) {
    await prisma.appUserRight.create({
      data: { userId: user.id, role, campus, grantedBy: admin?.email ?? null },
    });
  }
  revalidatePath('/settings/rights');
}

/** Edits an existing grant's role and/or campus in place — every role can be scoped to one
 *  campus or left at "All schools" (confirmed with the user: this is a real authorisation
 *  change, not just a label — see engine/rights.ts's hasRoleForCampus). */
export async function updateRightsGrant(id: string, formData: FormData): Promise<void> {
  await assertIsRightsAdmin();
  const role = String(formData.get('role') ?? '') as FeeRole;
  const campus = parseCampus(formData.get('campus'));
  if (!VALID_ROLES.includes(role)) return;
  if (campus !== null && !(await isKnownCampus(campus))) return;

  await prisma.appUserRight.update({ where: { id }, data: { role, campus } });
  revalidatePath('/settings/rights');
}

export async function removeRightsGrant(id: string): Promise<void> {
  await assertIsRightsAdmin();
  await prisma.appUserRight.delete({ where: { id } });
  revalidatePath('/settings/rights');
}
