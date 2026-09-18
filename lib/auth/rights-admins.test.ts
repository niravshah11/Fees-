import { describe, it, expect } from 'vitest';
import { resolveRightsAdmins, isRightsAdmin, DEFAULT_RIGHTS_ADMINS } from './rights-admins';

describe('resolveRightsAdmins', () => {
  it('falls back to the default admin when unset', () => {
    expect(resolveRightsAdmins(undefined)).toEqual(DEFAULT_RIGHTS_ADMINS);
  });

  it('parses a comma-separated override', () => {
    expect(resolveRightsAdmins('a@x.com, B@Y.com')).toEqual(['a@x.com', 'b@y.com']);
  });
});

describe('isRightsAdmin', () => {
  it('matches case-insensitively', () => {
    expect(isRightsAdmin('A@X.com', ['a@x.com'])).toBe(true);
  });

  it('rejects anyone not on the list', () => {
    expect(isRightsAdmin('other@x.com', ['a@x.com'])).toBe(false);
    expect(isRightsAdmin(null, ['a@x.com'])).toBe(false);
  });
});
