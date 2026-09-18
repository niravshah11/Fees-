// Reusable "New" marker for the what's-new convention (see app/help/page.tsx's WHATS_NEW).

export function NewBadge({ label = 'New' }: { label?: string }) {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      {label}
    </span>
  );
}

export function NewDot() {
  return (
    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" aria-label="new" />
  );
}
