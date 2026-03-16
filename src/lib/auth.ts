import { cookies } from 'next/headers';

const AUTH_COOKIE = 'crm_auth';
const PASSWORD = 'crmadmin2024';

export function verifyPassword(password: string): boolean {
  return password === PASSWORD;
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const auth = cookieStore.get(AUTH_COOKIE);
  return auth?.value === 'authenticated';
}

export function getAuthCookieValue() {
  return { name: AUTH_COOKIE, value: 'authenticated', path: '/', httpOnly: true, maxAge: 60 * 60 * 24 * 7 };
}
