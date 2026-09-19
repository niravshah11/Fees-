/** A school tile's whole background, tinted by its latest (non-superseded) FeeVersion's status
 *  (confirmed with the user) — the same three shades wherever a school shows up as a tile
 *  (Dashboard, Master data, Fee policies): green once approved, yellow while in review, and this
 *  third shade — a light brand blue, matching the Dashboard's "Draft / not started" stat card's
 *  own tone — for everything else (drafting, no proposal yet, or rejected).
 *
 *  `!` forces these to win over .fh-card's own `background`: same specificity, but the vendored
 *  design-system CSS loads after Tailwind's utilities in the bundle, so a plain utility class
 *  would otherwise lose (verified by inspecting the computed background without `!`). */
const TILE_TONE_CLASS: Record<string, string> = {
  APPROVED: '!bg-success-subtle',
  PENDING_APPROVAL: '!bg-warning-subtle',
};
const TILE_TONE_DEFAULT = '!bg-primary-subtle';

export function tileToneClass(latestStatus: string | undefined | null): string {
  return TILE_TONE_CLASS[latestStatus ?? ''] ?? TILE_TONE_DEFAULT;
}
