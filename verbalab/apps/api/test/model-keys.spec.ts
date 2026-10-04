import { describe, expect, it } from 'vitest';
import {
  generateModelApiKeySecret,
  generatePlatformModelRootKey,
  hashModelApiKey,
  looksLikeModelApiKey,
  looksLikePlatformModelRootKey,
} from '../src/common/crypto/model-keys';

describe('VerbaLab model keys', () => {
  it('mints live/test serving keys', () => {
    const live = generateModelApiKeySecret('live');
    expect(live.secret.startsWith('vmod_live_')).toBe(true);
    expect(looksLikeModelApiKey(live.secret)).toBe(true);
    expect(hashModelApiKey(live.secret)).toHaveLength(64);

    const test = generateModelApiKeySecret('test');
    expect(test.secret.startsWith('vmod_test_')).toBe(true);
  });

  it('mints platform root for VERBALAB_MODEL_API_KEY', () => {
    const root = generatePlatformModelRootKey();
    expect(root.secret.startsWith('vmod_root_')).toBe(true);
    expect(looksLikePlatformModelRootKey(root.secret)).toBe(true);
    expect(root.hash).toHaveLength(64);
  });
});
