'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { NewDot } from './_NewBadge';

interface Item {
  href: string;
  icon: string;
  label: string;
  isNew?: boolean;
}
const REFERENCE_ITEMS: Item[] = [
  { href: '/master', icon: 'master', label: 'Master data', isNew: true },
  { href: '/settings/rights', icon: 'rights', label: 'Rights', isNew: true },
  { href: '/help', icon: 'help', label: 'Help', isNew: true },
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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className="ml-auto h-4 w-4 shrink-0 transition-transform"
      style={{ transform: open ? 'rotate(180deg)' : undefined }}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function Nav({ schools }: { schools: { code: string }[] }) {
  const path = usePathname() ?? '/';
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));
  const onASchoolPage = path === '/' || path.startsWith('/schools');
  const [schoolsOpen, setSchoolsOpen] = useState(onASchoolPage);

  return (
    <nav className="flex flex-col gap-0.5">
      <div>
        <div className="fh-sidebar__section">Overview</div>
        <button
          type="button"
          onClick={() => setSchoolsOpen((v) => !v)}
          aria-expanded={schoolsOpen}
          className={`fh-sidebar__item w-full${path === '/' ? ' is-active' : ''}`}
        >
          <SideIcon name="dashboard" />
          <span className="bcn-lbl">
            Schools
            <NewDot />
          </span>
          <Chevron open={schoolsOpen} />
        </button>
        {schoolsOpen && (
          <div className="ml-8 flex flex-col gap-0.5 border-l border-border pl-2">
            <Link href="/" aria-current={path === '/' ? 'page' : undefined} className={`fh-sidebar__item py-1.5 text-sm${path === '/' ? ' is-active' : ''}`}>
              <span className="bcn-lbl">All schools</span>
            </Link>
            {schools.map((s) => {
              const href = `/schools/${s.code}`;
              const active = path.startsWith(href);
              return (
                <Link key={s.code} href={href} aria-current={active ? 'page' : undefined} className={`fh-sidebar__item py-1.5 text-sm${active ? ' is-active' : ''}`}>
                  <span className="bcn-lbl">{s.code}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="fh-sidebar__section">Reference</div>
        {REFERENCE_ITEMS.map((it) => {
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
    </nav>
  );
}
