import { describe, it, expect } from 'vitest';
import { canDraftForCampus, hasRole, hasAnyRights, type RightsGrant } from './rights';

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

describe('hasRole', () => {
  it('checks role membership regardless of campus', () => {
    const grants: RightsGrant[] = [{ role: 'BOARD_TRUSTEE', campus: null }];
    expect(hasRole(grants, 'BOARD_TRUSTEE')).toBe(true);
    expect(hasRole(grants, 'DIRECTOR')).toBe(false);
  });
});

describe('hasAnyRights', () => {
  it('is false for an empty grant list', () => {
    expect(hasAnyRights([])).toBe(false);
  });
});
