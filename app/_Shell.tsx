'use client';

import { useState, type ReactNode } from 'react';

// Responsive app shell (desktop: fixed sidebar rail; mobile: off-canvas drawer) — same pattern as
// the event-management app's app/_Shell.tsx.
export function Shell({
  brand,
  nav,
  topbarRight,
  orgLabel = 'Fountainhead Group · Fees',
  children,
}: {
  brand: ReactNode;
  nav: ReactNode;
  topbarRight: ReactNode;
  orgLabel?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className={`fh-appshell fh-appshell--drawer${open ? ' is-nav-open' : ''}`}>
      <aside className="fh-sidebar" onClick={close}>
        {brand}
        {nav}
      </aside>
      <div className="fh-appshell__scrim" onClick={close} aria-hidden />
      <div className="flex min-w-0 flex-col">
        <header className="fh-navbar">
          <button
            type="button"
            className="fh-navtoggle -ml-1 mr-1 rounded-md p-1.5 text-foreground hover:bg-surface-sunken"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <span className="text-sm text-muted">{orgLabel}</span>
          <div className="ml-auto flex items-center gap-3">{topbarRight}</div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
