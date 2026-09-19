'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

async function requireSchool(code: string) {
  const school = await prisma.school.findUnique({ where: { code } });
  if (!school) throw new Error(`Unknown school code: ${code}`);
  return school;
}

// Matches next.config.mjs's server-action bodySizeLimit — kept as one named constant so the two
// stay in sync if either changes.
const MAX_FILE_SIZE = 15 * 1024 * 1024;

/** Uploading is open to every signed-in colleague, same as drafting a fee proposal — there is no
 *  dedicated "editor" role. Each upload is a new row (never overwrites a prior one), so a
 *  campus's fee-policy history stays intact. */
export async function uploadFeePolicy(schoolCode: string, formData: FormData): Promise<void> {
  const school = await requireSchool(schoolCode);
  const academicYear = String(formData.get('academicYear') ?? '').trim();
  const file = formData.get('file');
  if (!academicYear || !(file instanceof File) || file.size === 0) return;
  if (file.type !== 'application/pdf') throw new Error('Only PDF files are accepted for a fee policy.');
  if (file.size > MAX_FILE_SIZE) throw new Error('File is too large — the limit is 15MB.');

  const user = await getCurrentUser();
  const fileData = Buffer.from(await file.arrayBuffer());

  await prisma.feePolicy.create({
    data: {
      schoolId: school.id,
      academicYear,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      fileData,
      uploadedBy: user?.email ?? null,
    },
  });
  revalidatePath(`/policies/${schoolCode}`);
}

export async function deleteFeePolicy(schoolCode: string, policyId: string): Promise<void> {
  const school = await requireSchool(schoolCode);
  const policy = await prisma.feePolicy.findUnique({ where: { id: policyId } });
  if (!policy || policy.schoolId !== school.id) throw new Error('Fee policy not found for this school.');

  await prisma.feePolicy.delete({ where: { id: policyId } });
  revalidatePath(`/policies/${schoolCode}`);
}
