import 'server-only';
import { prisma } from '../db';
import { getCurrentUser } from './session';
import { resolveRightsAdmins, isRightsAdmin } from './rights-admins';
import { canDraftForCampus, hasRole, type RightsGrant, type FeeRole } from '../../engine/rights';

// The auth()+Prisma wrapper around engine/rights.ts's pure predicates. Local `next dev` has no
// session (middleware.ts skips the sign-in wall there), so this defaults to holding every role
// unrestricted locally — same dev/prod split the event-management app uses — rather than
// requiring seeded AppUserRight rows just to click through the app.

const ALL_ROLES: FeeRole[] = ['SCHOOL_FINANCE', 'FEES_GROUP_COORDINATOR', 'HEAD_OF_OPERATIONS', 'DIRECTOR', 'BOARD_TRUSTEE'];

export async function getCurrentRights(): Promise<RightsGrant[]> {
  const user = await getCurrentUser();
  if (!user) {
    if (process.env.NODE_ENV !== 'production') {
      return ALL_ROLES.map((role) => ({ role, campus: null }));
    }
    return [];
  }
  const appUser = await prisma.appUser.findUnique({
    where: { email: user.email },
    include: { rights: { select: { role: true, campus: true } } },
  });
  return (appUser?.rights ?? []) as RightsGrant[];
}

export async function assertCanDraftForCampus(campus: string): Promise<void> {
  if (!canDraftForCampus(await getCurrentRights(), campus)) {
    throw new Error('Not authorised — you do not hold Finance Officer rights for this campus.');
  }
}

export async function assertHasRole(role: FeeRole): Promise<void> {
  if (!hasRole(await getCurrentRights(), role)) {
    throw new Error(`Not authorised — this action requires the ${role.replace('_', ' ')} role.`);
  }
}

/** Gates /settings/rights itself — deliberately independent of AppUserRight so the curation door
 *  stays reachable even with zero rights rows in existence. */
export async function assertIsRightsAdmin(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    if (process.env.NODE_ENV !== 'production') return;
    throw new Error('Not authorised.');
  }
  const admins = resolveRightsAdmins(process.env.RIGHTS_ADMIN_EMAILS);
  if (!isRightsAdmin(user.email, admins)) throw new Error('Not authorised — rights admins only.');
}
