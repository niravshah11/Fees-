import { auth } from '@/auth';
import { isPublicPath } from '@/lib/public-routes';

// Require Google sign-in for every page in PRODUCTION. Local `next dev` stays open — same
// dev/prod split as the event-management app (see lib/auth/rights.ts's header for why).
export default auth((req) => {
  if (isPublicPath(req.nextUrl.pathname)) return;
  if (process.env.NODE_ENV !== 'production') return;
  if (req.auth) return;

  const signInUrl = new URL('/api/auth/signin', req.nextUrl.origin);
  signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
  return Response.redirect(signInUrl);
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|svg|ico|webp|gif)).*)'],
};
