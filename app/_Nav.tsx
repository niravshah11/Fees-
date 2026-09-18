'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { NewDot } from './_NewBadge';

interface Item {
  href: string;
  icon: string;
  label: string;
  isNew?: boolean;
}
const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'Overview',
    items: [{ href: '/', icon: 'dashboard', label: 'Schools', isNew: true }],
  },
  {
    title: 'Reference',
    items: [
      { href: '/master', icon: 'master', label: 'Master data', isNew: true },
      { href: '/settings/rights', icon: 'rights', label: 'Rights', isNew: true },
      { href: '/help', icon: 'help', label: 'Help', isNew: true },
    ],
  },
];

const ICON: Record<string, ReactNode> = {
  dashboard: (<><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" /></>),
  master: (<><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></>),
  rights: (<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>),
  help: (<><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>),
};

function SideIcon({ name }: { name: string }) {
  return (
    <span className="bcn-ic" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {ICON[name]}
      </svg>
    </span>
  );
}

export function Nav() {
  const path = usePathname() ?? '/';
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <nav className="flex flex-col gap-0.5">
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="fh-sidebar__section">{section.title}</div>
          {section.items.map((it) => {
            const active = isActive(it.href);
            return (
              <Link key={it.href} href={it.href} aria-current={active ? 'page' : undefined} className={`fh-sidebar__item${active ? ' is-active' : ''}`}>
                <SideIcon name={it.icon} />
                <span className="bcn-lbl">
                  {it.label}
                  {it.isNew && <NewDot />}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
