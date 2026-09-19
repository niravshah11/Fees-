import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { plusJakarta } from './fonts';
import './globals.css';
// Relative path, not the bare '@fountainhead/design-system' specifier: an npm `file:` dependency
// installs as a symlink, and Next's webpack CSS handling doesn't resolve a global CSS import
// through a symlinked node_modules package reliably (works under plain Node, fails under
// `next build`). Importing the vendored file directly sidesteps that entirely.
import '../vendor/fountainhead-design-system/css/fountainhead.css';
import { Nav } from './_Nav';
import { Shell } from './_Shell';
import { ThemeToggle } from './_ThemeToggle';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { signOutAction } from './_auth-actions';

const NO_FLASH = `try{var t=localStorage.getItem('fh-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

// Every page.tsx already opts into force-dynamic since each queries Prisma directly, but that
// doesn't cover Next's auto-generated /_not-found route — it has no page.tsx of its own, only
// this layout, which also queries Prisma (for the Nav's school list). Without this, Next
// sometimes tries to statically prerender /_not-found at build time, where DATABASE_URL points
// at the Dockerfile's unreachable build-only placeholder — a flaky build failure (see
// prisma.school.findMany() below) that doesn't reproduce with a real DB reachable, like on local
// `next build`. Declaring it here forces every route under the root layout to skip prerendering.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Fountainhead Fees',
  description: 'Fee proposal & approval workspace for the Fountainhead group of schools',
};

export const viewport: Viewport = {
  themeColor: '#005BAA',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [schools, user] = await Promise.all([
    prisma.school.findMany({ orderBy: { order: 'asc' }, select: { code: true } }),
    getCurrentUser(),
  ]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={plusJakarta.variable}
      data-theme="light"
      data-density="comfortable"
      data-profile="product"
    >
      <body className="bg-background text-foreground font-body antialiased">
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
        <Shell
          brand={
            <div className="fh-sidebar__brand">
              <Link href="/" className="flex items-center gap-2 font-heading text-base font-bold">
                Fountainhead Fees
              </Link>
              {/* text-muted is tuned for the light card surfaces, not this always-dark navy
                  sidebar rail — it renders unreadably low-contrast there (confirmed by the
                  user); the design system's own dark-sidebar text uses translucent white
                  (components.css's [data-profile="product"] .fh-sidebar__section rule). */}
              <p className="mt-0.5 text-[11px] leading-tight text-white/60">Group fee proposal &amp; approval</p>
            </div>
          }
          nav={<Nav schools={schools} />}
          topbarRight={
            <>
              {/* Local dev has no session at all (middleware.ts skips the sign-in wall there),
                  so this only ever renders in production, where every page requires Google
                  sign-in — there was previously no way to see who's signed in or sign out. */}
              {user && (
                <div className="flex items-center gap-2">
                  <span className="hidden text-sm text-muted sm:inline">{user.name}</span>
                  <form action={signOutAction}>
                    <button type="submit" className="fh-btn fh-btn--outline fh-btn--sm">Sign out</button>
                  </form>
                </div>
              )}
              <ThemeToggle />
            </>
          }
        >
          {children}
        </Shell>
      </body>
    </html>
  );
}
