import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { resolveAllowedDomains, isAllowedEmail } from '@/lib/auth-domains';

// App-level Google sign-in (Auth.js) — same approach as the event-management app. This app's
// AppUser/AppUserRight table is the second gate (what a signed-in person can actually DO), so the
// domain allowlist here only decides who can sign in at all, and still fails CLOSED: an
// unset/blank AUTH_ALLOWED_DOMAINS falls back to the org domain list, never "everyone".
const ALLOWED_DOMAINS = resolveAllowedDomains(process.env.AUTH_ALLOWED_DOMAINS);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [Google],
  callbacks: {
    async signIn({ profile, user }) {
      if (profile && profile.email_verified === false) return false;
      return isAllowedEmail(profile?.email ?? user?.email, ALLOWED_DOMAINS);
    },
  },
});
