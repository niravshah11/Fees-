// Which paths the Google sign-in gate in middleware.ts lets through untouched. Zero imports —
// middleware runs on the edge runtime. Same convention as the event-management app.

export function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/api/health' ||
    pathname.startsWith('/api/auth')
  );
}
