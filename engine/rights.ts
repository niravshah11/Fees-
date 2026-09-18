// Pure logic for who may do what — no I/O, no next-auth, no Prisma (same split as the
// event-management app's engine/rights.ts). lib/auth/rights.ts holds the thin auth()+Prisma
// wrapper around these predicates.
//
// Unlike the event-management app's flat AppUserRight (existence = permission), fee approval
// genuinely needs distinct capability tiers — drafting a school's proposal, the group-level
// review, and the Board's final sign-off are different people with different scopes — so each
// grant here also carries a `role`.

export type FeeRole =
  | 'SCHOOL_FINANCE'
  | 'FEES_GROUP_COORDINATOR'
  | 'HEAD_OF_OPERATIONS'
  | 'HEAD_OF_FINANCE'
  | 'DIRECTOR'
  | 'BOARD_TRUSTEE';

/** One AppUserRight row's shape, as far as the decision cares. campus null = every campus;
 *  campus: 'FSK' (etc.) restricts that grant to just that one school. This applies uniformly to
 *  every role now (confirmed with the user) — a campus-scoped Director, say, can only act on
 *  that school's approval step, not the whole group's. */
export interface RightsGrant {
  role: FeeRole;
  campus: string | null;
}

/** True if any grant gives `role` at `campus` — either scoped exactly to it, or a campus-wide
 *  (null) grant, which covers every campus including ones added after the grant was made. This
 *  is the one check every role uses, including SCHOOL_FINANCE (via canDraftForCampus below) and
 *  every step of the approval chain. */
export function hasRoleForCampus(grants: RightsGrant[], role: FeeRole, campus: string): boolean {
  return grants.some((g) => g.role === role && (g.campus === null || g.campus === campus));
}

/** SCHOOL_FINANCE may draft/edit/submit for a school only if scoped to that school's campus (or
 *  holds a campus-wide grant). Thin, named wrapper over hasRoleForCampus for readability at call
 *  sites that only ever care about this one role. */
export function canDraftForCampus(grants: RightsGrant[], campus: string): boolean {
  return hasRoleForCampus(grants, 'SCHOOL_FINANCE', campus);
}

/** True if the person holds any grant at all (used for "can see admin-ish master data"). */
export function hasAnyRights(grants: RightsGrant[]): boolean {
  return grants.length > 0;
}
