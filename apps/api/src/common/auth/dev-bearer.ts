import { createHmac, timingSafeEqual } from 'crypto';

export type DevBearerPayload = {
  v: 1;
  clerkUserId: string;
  email: string;
  name: string;
  exp: number;
};

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64url');
}

function fromB64url(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

/** Only mint/verify when CLERK_SECRET_KEY is a test secret. */
export function isDevAuthAllowed(secretKey: string | undefined): boolean {
  return Boolean(secretKey?.startsWith('sk_test_'));
}

export function mintDevBearer(
  secretKey: string,
  input: Omit<DevBearerPayload, 'v' | 'exp'> & { ttlSeconds?: number },
): string {
  const payload: DevBearerPayload = {
    v: 1,
    clerkUserId: input.clerkUserId,
    email: input.email,
    name: input.name,
    exp: Math.floor(Date.now() / 1000) + (input.ttlSeconds ?? 60 * 60 * 12),
  };
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac('sha256', secretKey).update(body).digest('base64url');
  return `vl_dev_${body}.${sig}`;
}

export function verifyDevBearer(secretKey: string, token: string): DevBearerPayload | null {
  if (!token.startsWith('vl_dev_')) return null;
  const raw = token.slice('vl_dev_'.length);
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = createHmac('sha256', secretKey).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(fromB64url(body).toString('utf8')) as DevBearerPayload;
    if (payload.v !== 1 || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.clerkUserId || !payload.email) return null;
    return payload;
  } catch {
    return null;
  }
}
