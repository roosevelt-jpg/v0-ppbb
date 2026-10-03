/** Local/test-only auth bypass (sk_test_ Clerk instances). Never used with sk_live_. */

export const DEV_BEARER_STORAGE_KEY = 'verbalab_dev_bearer';
export const DEV_AUTH_COOKIE = 'verbalab_dev_auth';

export function getDevBearer(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(DEV_BEARER_STORAGE_KEY);
}

export function setDevBearer(token: string | null) {
  if (typeof window === 'undefined') return;
  if (!token) window.sessionStorage.removeItem(DEV_BEARER_STORAGE_KEY);
  else window.sessionStorage.setItem(DEV_BEARER_STORAGE_KEY, token);
}

export async function resolveApiToken(
  getToken?: () => Promise<string | null>,
): Promise<string | null> {
  const dev = getDevBearer();
  if (dev) return dev;
  if (!getToken) return null;
  return getToken();
}
