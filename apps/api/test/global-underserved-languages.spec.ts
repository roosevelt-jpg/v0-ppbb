import { LANGUAGE_SEEDS } from '../src/languages/language-seeds';
import { GLOBAL_LANGUAGE_SEEDS } from '../src/languages/global-language-seeds';
import { LOCALE_PACK_SEEDS } from '../src/locales/locale-pack-seeds';
import { DIALECT_SEEDS } from '../src/dialects/dialect-seeds';
import { ACCENT_SEEDS } from '../src/accents/accent-seeds';
import { OWN_TTS_VOICES } from '../src/gateway/own-tts.adapter';
import { FAMILY_SEEDS } from '../src/registry/family-seeds';
import { WRITING_SYSTEM_SEEDS } from '../src/registry/writing-system-seeds';

describe('Strategic global underserved language coverage', () => {
  it('seeds SEA / India / LatAm / Caribbean languages as strategic_global', () => {
    expect(GLOBAL_LANGUAGE_SEEDS.length).toBeGreaterThanOrEqual(30);
    expect(GLOBAL_LANGUAGE_SEEDS.every((l) => l.tier === 'strategic_global')).toBe(true);
    expect(LANGUAGE_SEEDS.filter((l) => l.tier === 'strategic_global').length).toBe(
      GLOBAL_LANGUAGE_SEEDS.length,
    );

    const codes = new Set(LANGUAGE_SEEDS.map((l) => l.code));
    for (const need of ['th', 'vi', 'tl', 'ms', 'bn', 'ta', 'te', 'ur', 'qu', 'gn', 'ht', 'jam', 'pap']) {
      expect(codes.has(need)).toBe(true);
    }
  });

  it('has family + writing system seeds for global scripts', () => {
    const families = new Set(FAMILY_SEEDS.map((f) => f.code));
    for (const f of ['dravidian', 'austroasiatic', 'tai_kadai', 'tupian', 'quechuan', 'creole']) {
      expect(families.has(f)).toBe(true);
    }
    const scripts = new Set(WRITING_SYSTEM_SEEDS.map((s) => s.code));
    for (const s of ['Thai', 'Taml', 'Telu', 'Beng', 'Khmr', 'Mymr', 'Gujr', 'Sinh']) {
      expect(scripts.has(s)).toBe(true);
    }
    for (const lang of GLOBAL_LANGUAGE_SEEDS) {
      expect(families.has(lang.familyCode!)).toBe(true);
      expect(scripts.has(lang.script!)).toBe(true);
    }
  });

  it('wires dialects, accents, locales, and own voices for global coverage', () => {
    const langs = new Set(LANGUAGE_SEEDS.map((l) => l.code));
    for (const d of DIALECT_SEEDS) expect(langs.has(d.languageCode)).toBe(true);
    for (const a of ACCENT_SEEDS) expect(langs.has(a.languageCode)).toBe(true);
    for (const l of LOCALE_PACK_SEEDS) expect(langs.has(l.languageCode)).toBe(true);

    const dialectCodes = new Set(DIALECT_SEEDS.map((d) => d.code));
    expect(dialectCodes.has('en-in')).toBe(true);
    expect(dialectCodes.has('es-mx')).toBe(true);
    expect(dialectCodes.has('pt-br')).toBe(true);
    expect(dialectCodes.has('ht-ht')).toBe(true);
    expect(dialectCodes.has('qu-pe')).toBe(true);

    const accentCodes = new Set(ACCENT_SEEDS.map((a) => a.code));
    expect(accentCodes.has('en-in')).toBe(true);
    expect(accentCodes.has('es-mx')).toBe(true);
    expect(accentCodes.has('jam-jm')).toBe(true);

    for (const a of ACCENT_SEEDS) {
      if (a.relatedDialectCode) expect(dialectCodes.has(a.relatedDialectCode)).toBe(true);
    }

    const localeLangs = new Set(LOCALE_PACK_SEEDS.map((l) => l.languageCode));
    expect(localeLangs.size).toBe(LOCALE_PACK_SEEDS.length);
    for (const code of GLOBAL_LANGUAGE_SEEDS.map((l) => l.code)) {
      expect(localeLangs.has(code)).toBe(true);
    }

    const voiceIds = OWN_TTS_VOICES.map((v) => v.id);
    for (const id of ['own:th-mali', 'own:hi-ananya', 'own:ht-marlene', 'own:qu-suma', 'own:es-lucia']) {
      expect(voiceIds).toContain(id);
    }
    expect(OWN_TTS_VOICES.length).toBeGreaterThanOrEqual(30);
  });
});
