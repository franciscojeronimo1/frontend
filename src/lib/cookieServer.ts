import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from './session';

export async function getCookieServer() {
  const cookiesStore = await cookies();
  return cookiesStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}