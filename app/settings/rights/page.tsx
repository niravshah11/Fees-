import Link from 'next/link';
import { prisma } from '@/lib/db';
import { SCHOOL_CONFIG } from '@/lib/school-config';
import { getCurrentUser } from '@/lib/auth/session';
import { resolveRightsAdmins, isRightsAdmin } from '@/lib/auth/rights-admins';
import { addRightsGrant, removeRightsGrant } from './actions';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = {
  SCHOOL_FINANCE: 'Finance Officer',
  FEES_GROUP_COORDINATOR: 'Fees Group Coordinator',
  HEAD_OF_OPERATIONS: 'Head of Operations',
  DIRECTOR: 'Director',
  BOARD_TRUSTEE: 'Board of Trustees',
};

export default async function RightsSettings() {
  const user = await getCurrentUser();
  const admins = resolveRightsAdmins(process.env.RIGHTS_ADMIN_EMAILS);
  const isAdmin = user ? isRightsAdmin(user.email, admins) : process.env.NODE_ENV !== 'production';

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <Link href="/" className="text-sm text-primary hover:underline">← Schools</Link>
        <div className="fh-alert fh-alert--warning">Rights is rights-admin only.</div>
      </div>
    );
  }

  const grants = await prisma.appUserRight.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ role: 'asc' }, { campus: 'asc' }, { user: { name: 'asc' } }],
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-primary hover:underline">← Schools</Link>
        <h1 className="mt-1 font-heading text-2xl font-bold text-foreground">Rights</h1>
        <p className="mt-1 text-muted">
          Every role needs an explicit grant. <strong>Finance Officer</strong> drafts/edits/submits
          a proposal for its own school. <strong>Fees Group Coordinator</strong>,{' '}
          <strong>Head of Operations</strong>, <strong>Director</strong>, and{' '}
          <strong>Board of Trustees</strong> each act on their own step of the group-wide
          approval chain, for every school.
        </p>
      </div>

      <div className="fh-card">
        <div className="overflow-x-auto">
          <table className="fh-table fh-table--striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>School</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {grants.map((g) => (
                <tr key={g.id}>
                  <td>{g.user.name}</td>
                  <td className="text-muted">{g.user.email}</td>
                  <td><span className="fh-badge">{ROLE_LABEL[g.role] ?? g.role}</span></td>
                  <td>{g.campus ?? 'All schools'}</td>
                  <td>
                    <form action={removeRightsGrant.bind(null, g.id)}>
                      <button type="submit" className="text-xs text-red-600 hover:underline">Remove</button>
                    </form>
                  </td>
                </tr>
              ))}
              {grants.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-muted">Nobody added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form action={addRightsGrant} className="mt-4 grid gap-3 sm:grid-cols-5">
          <input name="name" placeholder="Full name" className="fh-input" required />
          <input name="email" type="email" placeholder="name@fountainheadschools.org" className="fh-input" required />
          <select name="role" className="fh-input" defaultValue="SCHOOL_FINANCE">
            <option value="SCHOOL_FINANCE">Finance Officer</option>
            <option value="FEES_GROUP_COORDINATOR">Fees Group Coordinator</option>
            <option value="HEAD_OF_OPERATIONS">Head of Operations</option>
            <option value="DIRECTOR">Director</option>
            <option value="BOARD_TRUSTEE">Board of Trustees</option>
          </select>
          <select name="campus" className="fh-input" defaultValue={SCHOOL_CONFIG[0].code}>
            {SCHOOL_CONFIG.map((s) => (
              <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
            ))}
            <option value="">All schools</option>
          </select>
          <button type="submit" className="fh-btn fh-btn--primary">Add</button>
        </form>
        <p className="mt-2 text-xs text-muted">
          The school picker is ignored for Fees Group Coordinator / Head of Operations / Director /
          Board of Trustees — those roles always apply to every school.
        </p>
      </div>
    </div>
  );
}
