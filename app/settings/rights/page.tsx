import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { resolveRightsAdmins, isRightsAdmin } from '@/lib/auth/rights-admins';
import { addRightsGrant, updateRightsGrant, removeRightsGrant } from './actions';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = {
  FEES_GROUP_COORDINATOR: 'Fees Group Coordinator',
  HEAD_OF_OPERATIONS: 'Head of Operations',
  HEAD_OF_FINANCE: 'Head of Finance',
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

  const [grants, schools] = await Promise.all([
    prisma.appUserRight.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: [{ role: 'asc' }, { campus: 'asc' }, { user: { name: 'asc' } }],
    }),
    prisma.school.findMany({ orderBy: { order: 'asc' }, select: { code: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-primary hover:underline">← Schools</Link>
        <h1 className="mt-1 font-heading text-2xl font-bold text-foreground">Rights</h1>
        <p className="mt-1 text-muted">
          Drafting and editing a school's fee proposal and Master data is open to every signed-in
          colleague — no grant needed for that. A grant here is only for the approval chain:{' '}
          <strong>Fees Group Coordinator</strong>, <strong>Head of Operations</strong>,{' '}
          <strong>Head of Finance</strong>, <strong>Director</strong>, and{' '}
          <strong>Board of Trustees</strong> each act on their own step, scoped to a school or
          (leave "School" as "All schools") the whole group.
        </p>
      </div>

      <section className="fh-card">
        <h2 className="fh-card__title text-foreground">Current grants</h2>
        <div className="mt-3 overflow-x-auto">
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
              {grants.map((g) => {
                const formId = `grant-${g.id}`;
                return (
                  <tr key={g.id}>
                    <td>{g.user.name}</td>
                    <td className="text-muted">{g.user.email}</td>
                    <td>
                      <form id={formId} action={updateRightsGrant.bind(null, g.id)} />
                      <select name="role" form={formId} defaultValue={g.role} className="fh-input fh-input--sm">
                        {Object.entries(ROLE_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select name="campus" form={formId} defaultValue={g.campus ?? ''} className="fh-input fh-input--sm">
                        {schools.map((s) => (
                          <option key={s.code} value={s.code}>{s.code}</option>
                        ))}
                        <option value="">All schools</option>
                      </select>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <button type="submit" form={formId} className="fh-btn fh-btn--outline fh-btn--sm">Save</button>
                        <form action={removeRightsGrant.bind(null, g.id)}>
                          <button type="submit" className="text-xs text-red-600 hover:underline">Remove</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {grants.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-muted">Nobody added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="fh-card fh-card--accent-top">
        <h2 className="fh-card__title text-foreground">Add a grant</h2>
        <form action={addRightsGrant} className="mt-3 grid gap-3 sm:grid-cols-5">
          <input name="name" placeholder="Full name" className="fh-input" required />
          <input name="email" type="email" placeholder="name@fountainheadschools.org" className="fh-input" required />
          <select name="role" className="fh-input" defaultValue="FEES_GROUP_COORDINATOR">
            <option value="FEES_GROUP_COORDINATOR">Fees Group Coordinator</option>
            <option value="HEAD_OF_OPERATIONS">Head of Operations</option>
            <option value="HEAD_OF_FINANCE">Head of Finance</option>
            <option value="DIRECTOR">Director</option>
            <option value="BOARD_TRUSTEE">Board of Trustees</option>
          </select>
          <select name="campus" className="fh-input" defaultValue={schools[0]?.code ?? ''}>
            {schools.map((s) => (
              <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
            ))}
            <option value="">All schools</option>
          </select>
          <button type="submit" className="fh-btn fh-btn--primary">Add</button>
        </form>
        <p className="mt-2 text-xs text-muted">
          Every role can be scoped to one school or left at "All schools" — a campus-scoped grant
          only acts on that school's approval step, not the whole group's.
        </p>
      </section>
    </div>
  );
}
