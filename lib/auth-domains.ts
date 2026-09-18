// Who may sign in — the pure half of auth.ts, split out so it's testable without standing up
// NextAuth. Same convention (and the same domain list) as the event-management app's
// lib/auth-domains.ts: this is the app's ONLY sign-in gate, so it fails CLOSED — an unset
// override falls back to the org list, never "everyone".

/// The authoritative Fountainhead domain list. Kept identical to the event-management app's copy
/// on purpose — same Workspace org, same staff. If that list changes, update this one too.
export const DEFAULT_ALLOWED_DOMAINS = [
  'fountainheadschools.org',
  'protego.services',
  'fwgs.in',
  'falh.in',
  'fasv.in',
  'fpvesu.in',
  'fpadajan.in',
  'fsksurat.in',
  'fsmsurat.in',
  'fountainheadpreschools.org',
];

/// Parse an AUTH_ALLOWED_DOMAINS override (comma-separated, leading "@" and stray case/space
/// tolerated). Blank or unset => the default org list — never "everyone".
export function resolveAllowedDomains(raw: string | undefined): string[] {
  const configured = (raw ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_ALLOWED_DOMAINS;
}

/// True only if `email`'s domain is on `allowed`. Compares the LAST "@" segment.
export function isAllowedEmail(email: string | null | undefined, allowed: string[]): boolean {
  const normalized = (email ?? '').trim().toLowerCase();
  const at = normalized.lastIndexOf('@');
  if (at === -1) return false;
  const domain = normalized.slice(at + 1);
  if (domain === '') return false;
  return allowed.includes(domain);
}
