import { describe, it, expect } from 'vitest';
import { hasRoleForCampus, hasAnyRights, type RightsGrant } from './rights';

describe('hasRoleForCampus', () => {
  it('a campus-wide (null) grant covers every campus', () => {
    const grants: RightsGrant[] = [{ role: 'BOARD_TRUSTEE', campus: null }];
    expect(hasRoleForCampus(grants, 'BOARD_TRUSTEE', 'FSK')).toBe(true);
    expect(hasRoleForCampus(grants, 'BOARD_TRUSTEE', 'FWGS')).toBe(true);
  });

  it('a campus-scoped grant only covers that one campus — a real restriction, not just a label', () => {
    const grants: RightsGrant[] = [{ role: 'DIRECTOR', campus: 'FSK' }];
    expect(hasRoleForCampus(grants, 'DIRECTOR', 'FSK')).toBe(true);
    expect(hasRoleForCampus(grants, 'DIRECTOR', 'FSM')).toBe(false);
  });

  it('checks role, not just campus', () => {
    const grants: RightsGrant[] = [{ role: 'BOARD_TRUSTEE', campus: null }];
    expect(hasRoleForCampus(grants, 'DIRECTOR', 'FSK')).toBe(false);
  });
});

describe('hasAnyRights', () => {
  it('is false for an empty grant list', () => {
    expect(hasAnyRights([])).toBe(false);
  });
});
