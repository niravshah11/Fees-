import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { uploadFeePolicy, deleteFeePolicy } from './actions';

export const dynamic = 'force-dynamic';

const bytesFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${bytesFormat.format(bytes / 1024)} KB`;
  return `${bytesFormat.format(bytes / (1024 * 1024))} MB`;
}

export default async function SchoolPolicies({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const school = await prisma.school.findUnique({
    where: { code },
    include: {
      feePolicies: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, academicYear: true, fileName: true, fileSize: true, uploadedBy: true, createdAt: true },
      },
    },
  });
  if (!school) notFound();

  const [current, ...history] = school.feePolicies;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/policies" className="text-sm text-primary hover:underline">← Fee policies</Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-foreground">{school.code}</h1>
          <span className="fh-badge">{school.board}</span>
        </div>
        <p className="text-muted">{school.name}</p>
      </div>

      <section className="fh-card">
        <h2 className="font-heading text-lg font-bold text-foreground">Current policy</h2>

        {current ? (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-sunken p-3">
              <div>
                <div className="font-medium text-foreground">{school.code} — {current.academicYear}</div>
                <div className="text-sm text-muted">
                  {current.fileName} · {formatBytes(current.fileSize)}
                  {current.uploadedBy && <> · uploaded by {current.uploadedBy}</>}
                  {' · '}
                  {new Date(current.createdAt).toLocaleDateString('en-IN')}
                </div>
              </div>
              <a href={`/api/fee-policy/${current.id}`} target="_blank" rel="noreferrer" className="fh-btn fh-btn--outline fh-btn--sm">
                Open PDF
              </a>
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <iframe src={`/api/fee-policy/${current.id}`} title={`${school.code} fee policy`} className="h-[70vh] w-full" />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">No fee policy uploaded yet for {school.code} — add one below.</p>
        )}
      </section>

      <section className="fh-card">
        <h2 className="font-heading text-lg font-bold text-foreground">Upload a policy</h2>
        <p className="mt-1 text-sm text-muted">
          PDF only, up to 15MB. Uploading doesn't replace the current policy — it becomes the new
          current one, and the old one stays available in the history below.
        </p>
        <form action={uploadFeePolicy.bind(null, school.code)} className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="fh-label text-xs">Academic year</label>
            <input name="academicYear" placeholder="2026-27" className="fh-input" required />
          </div>
          <div className="flex-1">
            <label className="fh-label text-xs">PDF file</label>
            <input name="file" type="file" accept="application/pdf" className="fh-input" required />
          </div>
          <button type="submit" className="fh-btn fh-btn--primary">Upload</button>
        </form>
      </section>

      {history.length > 0 && (
        <section className="fh-card">
          <h2 className="font-heading text-lg font-bold text-foreground">History</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="fh-table fh-table--striped">
              <thead>
                <tr>
                  <th>Academic year</th>
                  <th>File</th>
                  <th>Uploaded</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {history.map((policy) => (
                  <tr key={policy.id}>
                    <td>{policy.academicYear}</td>
                    <td>
                      <a href={`/api/fee-policy/${policy.id}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {policy.fileName}
                      </a>{' '}
                      <span className="text-muted">({formatBytes(policy.fileSize)})</span>
                    </td>
                    <td className="text-muted">
                      {new Date(policy.createdAt).toLocaleDateString('en-IN')}
                      {policy.uploadedBy && <> · {policy.uploadedBy}</>}
                    </td>
                    <td>
                      <form action={deleteFeePolicy.bind(null, school.code, policy.id)}>
                        <button type="submit" className="text-xs text-red-600 hover:underline">Remove</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
