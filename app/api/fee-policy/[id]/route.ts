import { prisma } from '@/lib/db';

// Serves a fee-policy PDF's raw bytes. No extra auth check here beyond middleware's sign-in
// wall — viewing a policy needs no more than viewing the rest of the app (open to every
// signed-in colleague, same as drafting a fee proposal).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const policy = await prisma.feePolicy.findUnique({
    where: { id },
    select: { fileName: true, mimeType: true, fileSize: true, fileData: true },
  });
  if (!policy) return new Response('Not found', { status: 404 });

  return new Response(new Uint8Array(policy.fileData), {
    headers: {
      'Content-Type': policy.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(policy.fileName)}"`,
      'Content-Length': String(policy.fileSize),
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
