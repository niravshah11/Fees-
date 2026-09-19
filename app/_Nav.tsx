'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
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
  { href: '/policies', icon: 'policy', label: 'Fee policies', isNew: true },
  { href: '/settings/rights', icon: 'rights', label: 'Rights', isNew: true },
  { href: '/reports', icon: 'reports', label: 'Reports', isNew: true },
  { href: '/help', icon: 'help', label: 'Help', isNew: true },
];

const ICON: Record<string, ReactNode> = {
  dashboard: (<><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" /></>),
  school: (<><path d="M5 21V7l7-4 7 4v14" /><path d="M3 21h18" /><path d="M9 21v-4a3 3 0 0 1 6 0v4" /></>),
  master: (<><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></>),
  rights: (<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>),
  policy: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h6" /></>),
  help: (<><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>),
  reports: (<><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="5" width="3" height="13" /></>),
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

export function Nav({ schools }: { schools: { code: string }[] }) {
  const path = usePathname() ?? '/';
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));
  const onASchoolPage = path.startsWith('/schools');

  return (
    <nav className="flex flex-col gap-0.5">
      <div>
        <Link href="/" aria-current={path === '/' ? 'page' : undefined} className={`fh-sidebar__item${path === '/' ? ' is-active' : ''}`}>
          <SideIcon name="dashboard" />
          <span className="bcn-lbl">
            Dashboard
            <NewDot />
          </span>
        </Link>
      </div>

      <div>
        <div className="fh-sidebar__section">Overview</div>
        <div className={`fh-sidebar__item${onASchoolPage ? ' is-active' : ''}`}>
          <SideIcon name="school" />
          <span className="bcn-lbl">Schools</span>
        </div>
        <div className="ml-8 flex flex-col gap-0.5 border-l border-border pl-2">
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
