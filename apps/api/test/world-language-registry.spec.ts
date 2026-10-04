import { existsSync } from 'fs';
import { join } from 'path';
import {
  worldLanguageSeed,
  worldLanguageRegistryEngineCatalog,
  worldLanguageFamilies,
} from '../src/world-language-registry/world-language-registry.catalog';
import { COUNTRY_PACK_SEEDS } from '../src/country-packs/country-pack-seeds';
import { GLOBAL_LANGUAGE_SEEDS } from '../src/languages/global-language-seeds';
import { listAfricanGrammarPacks } from '../src/grammar/african-grammar-rules';
import { STYLE_PROFILES } from '../src/style/style-profiles';
import { GOLDEN_PAIRS } from '../src/eval/goldens';
import { GLOBAL_LEX_PACKS } from '../src/model-runtime/global-linguistic-packs';

const root = join(__dirname, '../../..');

describe('World Language Registry + global parity', () => {
  it('documents World Language Registry', () => {
    expect(existsSync(join(root, 'docs/WORLD_LANGUAGE_REGISTRY.md'))).toBe(true);
  });

  it('seeds world registry with culture/people macro-varieties', () => {
    const seed = worldLanguageSeed();
    expect(seed.length).toBeGreaterThanOrEqual(36);
    const codes = new Set(seed.map((l) => l.code));
    for (const need of ['th', 'vi', 'tl', 'bn', 'ta', 'qu', 'ht', 'jam', 'es-latam', 'en-india', 'hi-india']) {
      expect(codes.has(need)).toBe(true);
    }
    expect(worldLanguageFamilies().length).toBeGreaterThanOrEqual(8);
    const engine = worldLanguageRegistryEngineCatalog();
    expect(engine.product).toBe('VerbaLab World Language Registry');
    expect(engine.honesty.coverageComplete).toBe(false);
    expect(engine.honesty.globalCountryPacksSeeded).toBe(true);
  });

  it('has country packs for SEA / India / LatAm / Caribbean markets', () => {
    const codes = new Set(COUNTRY_PACK_SEEDS.map((c) => c.code));
    for (const need of ['TH', 'VN', 'PH', 'MY', 'IN', 'BD', 'MX', 'PE', 'BR', 'HT', 'JM', 'HK']) {
      expect(codes.has(need)).toBe(true);
    }
    expect(COUNTRY_PACK_SEEDS.length).toBeGreaterThanOrEqual(70);
  });

  it('has grammar, style, lexicon, and golden coverage for priority global langs', () => {
    const grammar = new Set(listAfricanGrammarPacks().map((p) => p.id));
    for (const id of ['th', 'vi', 'hi', 'ta', 'ht', 'tl', 'ms', 'bn', 'qu']) {
      expect(grammar.has(id)).toBe(true);
    }
    const styles = new Set(STYLE_PROFILES.map((p) => p.id));
    for (const id of ['sea_formal', 'india_plain', 'latam_business', 'caribbean_creole']) {
      expect(styles.has(id)).toBe(true);
    }
    for (const pair of ['en-th', 'en-vi', 'en-hi', 'en-ht', 'en-qu']) {
      expect(GLOBAL_LEX_PACKS[pair]?.length).toBeGreaterThanOrEqual(6);
    }
    const goldenTargets = new Set(GOLDEN_PAIRS.map((p) => p.targetLang));
    for (const t of ['th', 'vi', 'ht', 'qu', 'hi']) {
      expect(goldenTargets.has(t)).toBe(true);
    }
    expect(GLOBAL_LANGUAGE_SEEDS.length).toBeGreaterThanOrEqual(30);
  });
});
