/** 7 dias em segundos */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export const SESSION_COOKIE_NAME = 'session';

export const SESSION_COOKIE_OPTIONS = {
  path: '/',
  maxAge: SESSION_MAX_AGE,
  sameSite: 'lax' as const,
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
};
