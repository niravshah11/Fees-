import 'server-only';
import { auth } from '../../auth';

export interface CurrentUser {
  email: string;
  name: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  return { email, name: session?.user?.name ?? email };
}
