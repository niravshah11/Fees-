import { Plus_Jakarta_Sans } from 'next/font/google';

// Same face as the event-management app (Beacon/product profile convention): one modern
// humanist-geometric font for headings and body, self-hosted at build via next/font.
export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});
