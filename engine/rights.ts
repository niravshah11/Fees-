// Pure logic for who may do what — no I/O, no next-auth, no Prisma (same split as the
// event-management app's engine/rights.ts). lib/auth/rights.ts holds the thin auth()+Prisma
// wrapper around these predicates.
//
// Drafting/editing a school's proposal and its Master data is open to every signed-in colleague
// (confirmed with the user — there is no dedicated "editor" position); only the approval chain
// itself is role-gated, one grant per step.

export type FeeRole =
  | 'FEES_GROUP_COORDINATOR'
  | 'HEAD_OF_OPERATIONS'
  | 'HEAD_OF_FINANCE'
  | 'DIRECTOR'
  | 'BOARD_TRUSTEE';

/** One AppUserRight row's shape, as far as the decision cares. campus null = every campus;
 *  campus: 'FSK' (etc.) restricts that grant to just that one school. This applies uniformly to
 *  every role (confirmed with the user) — a campus-scoped Director, say, can only act on that
 *  school's approval step, not the whole group's. */
export interface RightsGrant {
  role: FeeRole;
  campus: string | null;
}

/** True if any grant gives `role` at `campus` — either scoped exactly to it, or a campus-wide
 *  (null) grant, which covers every campus including ones added after the grant was made. This
 *  is the one check every approval-chain step uses. */
export function hasRoleForCampus(grants: RightsGrant[], role: FeeRole, campus: string): boolean {
  return grants.some((g) => g.role === role && (g.campus === null || g.campus === campus));
}

/** True if the person holds any grant at all (used for "can see admin-ish master data"). */
export function hasAnyRights(grants: RightsGrant[]): boolean {
  return grants.length > 0;
}
