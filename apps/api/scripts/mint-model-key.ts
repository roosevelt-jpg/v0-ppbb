/**
 * Offline mint of a VerbaLab platform model root key.
 * Prints env snippet — does not write .env (avoid committing secrets).
 *
 *   pnpm --dir apps/api exec tsx scripts/mint-model-key.ts
 */
import { generatePlatformModelRootKey, generateModelApiKeySecret } from '../src/common/crypto/model-keys';

const kind = (process.argv[2] ?? 'root').toLowerCase();

if (kind === 'live' || kind === 'test') {
  const out = generateModelApiKeySecret(kind);
  console.log(`# VerbaLab serving key (${kind}) — store securely, shown once`);
  console.log(`# prefix ${out.prefix}`);
  console.log(out.secret);
  process.exit(0);
}

const root = generatePlatformModelRootKey();
console.log('# VerbaLab platform model root — add to API + model-service deploy');
console.log(`# prefix ${root.prefix}`);
console.log(`VERBALAB_MODEL_API_KEY=${root.secret}`);
console.log('# Optional: VERBALAB_MODEL_BASE_URL=https://models.your-domain.com/v1');
