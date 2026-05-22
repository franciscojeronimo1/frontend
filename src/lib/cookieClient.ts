import { getCookie } from 'cookies-next';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from './session';

export function getCookieClient() {
  return getCookie(SESSION_COOKIE_NAME, { path: SESSION_COOKIE_OPTIONS.path });
}