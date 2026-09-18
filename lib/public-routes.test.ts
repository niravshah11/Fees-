import { describe, it, expect } from 'vitest';
import { isPublicPath } from './public-routes';

describe('isPublicPath', () => {
  it('lets the health check and auth flow through', () => {
    expect(isPublicPath('/api/health')).toBe(true);
    expect(isPublicPath('/api/auth/signin')).toBe(true);
    expect(isPublicPath('/api/auth/callback/google')).toBe(true);
  });

  it('gates everything else', () => {
    expect(isPublicPath('/')).toBe(false);
    expect(isPublicPath('/schools/FSK')).toBe(false);
  });
});
