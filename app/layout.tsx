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

const NO_FLASH = `try{var t=localStorage.getItem('fh-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export const metadata: Metadata = {
  title: 'Fountainhead Fees',
  description: 'Fee proposal & approval workspace for the Fountainhead group of schools',
};

export const viewport: Viewport = {
  themeColor: '#005BAA',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
              <p className="mt-0.5 text-[11px] leading-tight text-muted">Group fee proposal &amp; approval</p>
            </div>
          }
          nav={<Nav />}
          topbarRight={<ThemeToggle />}
        >
          {children}
        </Shell>
      </body>
    </html>
  );
}
