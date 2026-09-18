import { describe, it, expect } from 'vitest';
import { resolveAllowedDomains, isAllowedEmail, DEFAULT_ALLOWED_DOMAINS } from './auth-domains';

describe('resolveAllowedDomains', () => {
  it('falls back to the default org list when unset', () => {
    expect(resolveAllowedDomains(undefined)).toEqual(DEFAULT_ALLOWED_DOMAINS);
    expect(resolveAllowedDomains('')).toEqual(DEFAULT_ALLOWED_DOMAINS);
  });

  it('parses a comma-separated override, tolerating case/space/leading @', () => {
    expect(resolveAllowedDomains(' Example.com , @Other.org ')).toEqual(['example.com', 'other.org']);
  });
});

describe('isAllowedEmail', () => {
  const allowed = ['fsksurat.in'];

  it('accepts an address on an allowed domain', () => {
    expect(isAllowedEmail('finance@fsksurat.in', allowed)).toBe(true);
  });

  it('rejects an address on a different domain', () => {
    expect(isAllowedEmail('someone@gmail.com', allowed)).toBe(false);
  });

  it('uses the LAST @ segment, not a display-name trick', () => {
    expect(isAllowedEmail('a@fsksurat.in@evil.com', allowed)).toBe(false);
  });

  it('rejects null/blank input', () => {
    expect(isAllowedEmail(null, allowed)).toBe(false);
    expect(isAllowedEmail('', allowed)).toBe(false);
  });
});
