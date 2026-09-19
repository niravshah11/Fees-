'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { createDraftVersionForSchool } from '@/lib/fee-draft';

/** Starts next year's draft for every school whose latest (non-superseded) version is APPROVED —
 *  exactly the same eligibility a school's own "Start next year's proposal" card checks, just run
 *  across every campus in one action (confirmed with the user) instead of clicking through six
 *  school pages one at a time. Schools already mid-draft, in review, or with no approved fee yet
 *  are silently skipped, same as they'd be on their own page. */
export async function startNextYearForAllSchools(formData: FormData): Promise<void> {
  const academicYear = String(formData.get('academicYear') ?? '').trim();
  if (!academicYear) return;

  const user = await getCurrentUser();
  const schools = await prisma.school.findMany({
    include: {
      feeVersions: {
        where: { status: { not: 'SUPERSEDED' } },
        orderBy: [{ academicYear: 'desc' }, { createdAt: 'desc' }],
        take: 1,
      },
    },
  });

  for (const school of schools) {
    if (school.feeVersions[0]?.status !== 'APPROVED') continue;
    await createDraftVersionForSchool(school.id, academicYear, user?.email ?? null);
  }

  revalidatePath('/');
}
