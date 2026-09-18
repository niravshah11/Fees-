// Pure logic for who may do what — no I/O, no next-auth, no Prisma (same split as the
// event-management app's engine/rights.ts). lib/auth/rights.ts holds the thin auth()+Prisma
// wrapper around these predicates.
//
// Unlike the event-management app's flat AppUserRight (existence = permission), fee approval
// genuinely needs distinct capability tiers — drafting a school's proposal, the group-level
// review, and the Board's final sign-off are different people with different scopes — so each
// grant here also carries a `role`.

export type FeeRole = 'SCHOOL_FINANCE' | 'FEES_GROUP_COORDINATOR' | 'HEAD_OF_OPERATIONS' | 'DIRECTOR' | 'BOARD_TRUSTEE';

/** One AppUserRight row's shape, as far as the decision cares. campus null = every campus
 *  (always true for the four group-level roles; SCHOOL_FINANCE is scoped to one school). */
export interface RightsGrant {
  role: FeeRole;
  campus: string | null;
}

/** SCHOOL_FINANCE may draft/edit/submit for a school only if scoped to that school's campus (or
 *  holds a campus-wide grant). */
export function canDraftForCampus(grants: RightsGrant[], campus: string): boolean {
  return grants.some((g) => g.role === 'SCHOOL_FINANCE' && (g.campus === null || g.campus === campus));
}

/** The four approval-chain roles (Fees Group Coordinator, Head of Operations, Director, Board of
 *  Trustees) act on their chain step for ANY school — not campus-scoped, since each reviews
 *  across the whole group. */
export function hasRole(grants: RightsGrant[], role: FeeRole): boolean {
  return grants.some((g) => g.role === role);
}

/** True if the person holds any grant at all (used for "can see admin-ish master data"). */
export function hasAnyRights(grants: RightsGrant[]): boolean {
  return grants.length > 0;
}
