import { describe, it, expect } from 'vitest';
import { canDraftForCampus, hasRoleForCampus, hasAnyRights, type RightsGrant } from './rights';

describe('canDraftForCampus', () => {
  it('allows SCHOOL_FINANCE scoped to that exact campus', () => {
    const grants: RightsGrant[] = [{ role: 'SCHOOL_FINANCE', campus: 'FSK' }];
    expect(canDraftForCampus(grants, 'FSK')).toBe(true);
    expect(canDraftForCampus(grants, 'FSM')).toBe(false);
  });

  it('a campus-wide (null) SCHOOL_FINANCE grant covers every campus', () => {
    const grants: RightsGrant[] = [{ role: 'SCHOOL_FINANCE', campus: null }];
    expect(canDraftForCampus(grants, 'FWGS')).toBe(true);
  });

  it('a DIRECTOR grant does not itself confer drafting rights', () => {
    const grants: RightsGrant[] = [{ role: 'DIRECTOR', campus: null }];
    expect(canDraftForCampus(grants, 'FSK')).toBe(false);
  });
});

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
