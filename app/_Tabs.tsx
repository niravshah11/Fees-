'use client';

import { useState, type ReactNode } from 'react';

/** Lightweight client-side tabs — content for every tab is already server-rendered (passed in as
 *  plain ReactNode), this component only toggles which one is visible. No route change, no
 *  re-fetch. */
export function Tabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setActive(i)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              i === active ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Keyed by index so React remounts on switch instead of patching in place — tab contents
          with the same shape (e.g. one edit form per fee head) would otherwise keep stale
          uncontrolled input values (defaultValue/defaultChecked only apply on first mount). Keyed
          by index rather than label since two tabs' labels aren't guaranteed unique. */}
      <div className="pt-4" key={active}>{tabs[active].content}</div>
    </div>
  );
}
