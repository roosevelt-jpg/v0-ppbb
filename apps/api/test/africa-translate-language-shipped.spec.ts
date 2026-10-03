import { COUNTRY_PACK_SEEDS } from '../src/country-packs/country-pack-seeds';
import { LANGUAGE_SEEDS } from '../src/languages/language-seeds';
import { LOCALE_PACK_SEEDS } from '../src/locales/locale-pack-seeds';
import { DIALECT_SEEDS } from '../src/dialects/dialect-seeds';
import { ACCENT_SEEDS } from '../src/accents/accent-seeds';
import { africanLanguageSeed, africanLanguageRegistryEngineCatalog } from '../src/african-language-registry/african-language-registry.catalog';
import { translateEngineCatalog } from '../src/translate/translate-engine.catalog';
import { localizationPlatformCatalog } from '../src/localize/localization-platform.catalog';
import { tmIntelligenceCatalog } from '../src/tm/tm-intelligence.catalog';
import { grammarIntelligenceCatalog } from '../src/grammar/grammar-intelligence.catalog';
import { styleIntelligenceCatalog } from '../src/style/style-intelligence.catalog';
import { STYLE_PROFILES } from '../src/style/style-profiles';
import { listAfricanGrammarPacks, applyAfricanGrammarRules } from '../src/grammar/african-grammar-rules';
import { VERTICAL_GLOSSARY_PACKS } from '../src/vertical-glossaries/vertical-glossary-seeds';

describe('Africa + Translate/Language shipped closeout', () => {
  it('seeds all AU country packs and major African languages', () => {
    expect(COUNTRY_PACK_SEEDS).toHaveLength(54);
    expect(LANGUAGE_SEEDS.filter((l) => l.tier === 'strategic_african').length).toBeGreaterThanOrEqual(140);
    expect(LOCALE_PACK_SEEDS.length).toBeGreaterThanOrEqual(140);
    expect(DIALECT_SEEDS.length).toBeGreaterThanOrEqual(40);
    expect(ACCENT_SEEDS.length).toBeGreaterThanOrEqual(25);
    expect(africanLanguageSeed().length).toBeGreaterThanOrEqual(50);

    const langs = new Set(LANGUAGE_SEEDS.map((l) => l.code));
    for (const c of COUNTRY_PACK_SEEDS) {
      for (const code of c.primaryLanguages) {
        expect(langs.has(code)).toBe(true);
      }
    }
    for (const d of DIALECT_SEEDS) expect(langs.has(d.languageCode)).toBe(true);
    for (const a of ACCENT_SEEDS) expect(langs.has(a.languageCode)).toBe(true);
    for (const l of LOCALE_PACK_SEEDS) expect(langs.has(l.languageCode)).toBe(true);

    const localeCodes = LOCALE_PACK_SEEDS.map((l) => l.languageCode);
    expect(new Set(localeCodes).size).toBe(localeCodes.length);

    // Ghana / South Africa / East / North coverage smoke
    const gh = COUNTRY_PACK_SEEDS.find((c) => c.code === 'GH')!;
    expect(gh.primaryLanguages).toEqual(expect.arrayContaining(['en', 'ak', 'tw', 'ee']));
    const za = COUNTRY_PACK_SEEDS.find((c) => c.code === 'ZA')!;
    expect(za.primaryLanguages.length).toBeGreaterThanOrEqual(8);
    expect(COUNTRY_PACK_SEEDS.some((c) => c.code === 'EG')).toBe(true);
    expect(COUNTRY_PACK_SEEDS.some((c) => c.code === 'MA')).toBe(true);
    expect(COUNTRY_PACK_SEEDS.some((c) => c.code === 'KE')).toBe(true);
  });

  it('ships Translate / Localization / TM / Grammar / Style catalogs without partial', () => {
    for (const catalog of [
      translateEngineCatalog(),
      localizationPlatformCatalog(),
      tmIntelligenceCatalog(),
      grammarIntelligenceCatalog(),
      styleIntelligenceCatalog(),
    ]) {
      const caps = (catalog as { capabilities: Array<{ id: string; status: string }> }).capabilities;
      expect(caps.every((c) => c.status !== 'partial')).toBe(true);
    }
    const registry = africanLanguageRegistryEngineCatalog();
    expect(registry.capabilities.every((c) => c.status !== 'partial')).toBe(true);
    expect(registry.honesty.africaCountryPacksComplete).toBe(true);
  });

  it('keeps website/mobile/game localization deferred', () => {
    const loc = localizationPlatformCatalog();
    expect(loc.capabilities.find((c) => c.id === 'websites')?.status).toBe('deferred');
    expect(loc.capabilities.find((c) => c.id === 'mobile_apps')?.status).toBe('deferred');
    expect(loc.capabilities.find((c) => c.id === 'games')?.status).toBe('deferred');
    const tr = translateEngineCatalog();
    expect(tr.capabilities.find((c) => c.id === 'website')?.status).toBe('deferred');
    expect(tr.capabilities.find((c) => c.id === 'whatsapp')?.status).toBe('deferred');
  });

  it('ships African grammar packs and writing style profiles', () => {
    expect(listAfricanGrammarPacks().map((p) => p.id)).toEqual(
      expect.arrayContaining(['sw', 'yo', 'ha', 'am', 'zu', 'ar', 'af', 'ig', 'wo', 'ak']),
    );
    const sw = applyAfricanGrammarRules('asantte sana', 'sw');
    expect(sw.pack).toBe('sw');
    expect(sw.corrected).toContain('asante');

    const styleIds = STYLE_PROFILES.map((p) => p.id);
    expect(styleIds).toEqual(
      expect.arrayContaining([
        'african_public_sector',
        'african_plain',
        'east_african_formal',
        'west_african_business',
      ]),
    );
  });

  it('ships Africa-first glossary starter packs for free install', () => {
    expect(VERTICAL_GLOSSARY_PACKS.length).toBeGreaterThanOrEqual(11);
    expect(VERTICAL_GLOSSARY_PACKS.map((p) => p.targetLang)).toEqual(
      expect.arrayContaining(['sw', 'yo', 'ha', 'am', 'zu', 'ar']),
    );
  });
});
