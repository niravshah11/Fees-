// Who may curate the rights list (add/remove AppUser/AppUserRight rows) — same convention as the
// event-management app. Fails closed to a single default admin so the feature is never
// unbootstrappable: an unset override never means "everyone can curate the list".

export const DEFAULT_RIGHTS_ADMINS = ['nirav.shah@fountainheadschools.org'];

export function resolveRightsAdmins(raw: string | undefined): string[] {
  const configured = (raw ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_RIGHTS_ADMINS;
}

export function isRightsAdmin(email: string | null | undefined, admins: string[]): boolean {
  const normalized = (email ?? '').trim().toLowerCase();
  if (!normalized) return false;
  return admins.includes(normalized);
}
