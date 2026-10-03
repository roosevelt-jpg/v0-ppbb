import { createHash, randomBytes } from 'crypto';

export type ModelKeyEnvironment = 'live' | 'test';

const LIVE_PREFIX = 'vmod_live_';
const TEST_PREFIX = 'vmod_test_';

export function modelKeyPrefixForEnvironment(environment: ModelKeyEnvironment): string {
  return environment === 'test' ? TEST_PREFIX : LIVE_PREFIX;
}

export function generateModelApiKeySecret(
  environment: ModelKeyEnvironment = 'live',
): { secret: string; prefix: string; hash: string; environment: ModelKeyEnvironment } {
  const keyPrefix = modelKeyPrefixForEnvironment(environment);
  const raw = randomBytes(32).toString('base64url');
  const secret = `${keyPrefix}${raw}`;
  const prefix = secret.slice(0, 18);
  return { secret, prefix, hash: hashModelApiKey(secret), environment };
}

export function hashModelApiKey(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function looksLikeModelApiKey(token: string): boolean {
  return token.startsWith(LIVE_PREFIX) || token.startsWith(TEST_PREFIX);
}

/** Platform root key for VERBALAB_MODEL_API_KEY (service-to-service). */
export function generatePlatformModelRootKey(): { secret: string; prefix: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  const secret = `vmod_root_${raw}`;
  return {
    secret,
    prefix: secret.slice(0, 18),
    hash: hashModelApiKey(secret),
  };
}

export function looksLikePlatformModelRootKey(token: string): boolean {
  return token.startsWith('vmod_root_');
}
