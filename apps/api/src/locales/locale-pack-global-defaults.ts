type HonorificEntry = {
  form: string;
  usage: string;
  notes?: string;
};

type LocalePackSeed = {
  languageCode: string;
  bcp47: string;
  dateNotes: string;
  numberNotes: string;
  currencyCode: string;
  currencyNotes: string;
  honorifics: HonorificEntry[];
  doNotTranslate: string[];
  culturalNotes: string;
};

/**
 * Default locale packs for strategic_global languages (SEA / India / LatAm / Caribbean).
 * One pack per languageCode — dialects carry finer regional nuance.
 */
const GLOBAL_LOCALE_DEFAULTS: Array<{
  languageCode: string;
  countryHint: string;
  currencyCode: string;
}> = [
  { languageCode: 'th', countryHint: 'TH', currencyCode: 'THB' },
  { languageCode: 'vi', countryHint: 'VN', currencyCode: 'VND' },
  { languageCode: 'tl', countryHint: 'PH', currencyCode: 'PHP' },
  { languageCode: 'ms', countryHint: 'MY', currencyCode: 'MYR' },
  { languageCode: 'km', countryHint: 'KH', currencyCode: 'KHR' },
  { languageCode: 'lo', countryHint: 'LA', currencyCode: 'LAK' },
  { languageCode: 'my', countryHint: 'MM', currencyCode: 'MMK' },
  { languageCode: 'jv', countryHint: 'ID', currencyCode: 'IDR' },
  { languageCode: 'su', countryHint: 'ID', currencyCode: 'IDR' },
  { languageCode: 'ceb', countryHint: 'PH', currencyCode: 'PHP' },
  { languageCode: 'hil', countryHint: 'PH', currencyCode: 'PHP' },
  { languageCode: 'war', countryHint: 'PH', currencyCode: 'PHP' },
  { languageCode: 'yue', countryHint: 'HK', currencyCode: 'HKD' },
  { languageCode: 'bn', countryHint: 'BD', currencyCode: 'BDT' },
  { languageCode: 'ta', countryHint: 'IN', currencyCode: 'INR' },
  { languageCode: 'te', countryHint: 'IN', currencyCode: 'INR' },
  { languageCode: 'mr', countryHint: 'IN', currencyCode: 'INR' },
  { languageCode: 'gu', countryHint: 'IN', currencyCode: 'INR' },
  { languageCode: 'kn', countryHint: 'IN', currencyCode: 'INR' },
  { languageCode: 'ml', countryHint: 'IN', currencyCode: 'INR' },
  { languageCode: 'pa', countryHint: 'IN', currencyCode: 'INR' },
  { languageCode: 'or', countryHint: 'IN', currencyCode: 'INR' },
  { languageCode: 'as', countryHint: 'IN', currencyCode: 'INR' },
  { languageCode: 'ur', countryHint: 'PK', currencyCode: 'PKR' },
  { languageCode: 'ne', countryHint: 'NP', currencyCode: 'NPR' },
  { languageCode: 'si', countryHint: 'LK', currencyCode: 'LKR' },
  { languageCode: 'bho', countryHint: 'IN', currencyCode: 'INR' },
  { languageCode: 'qu', countryHint: 'PE', currencyCode: 'PEN' },
  { languageCode: 'gn', countryHint: 'PY', currencyCode: 'PYG' },
  { languageCode: 'ay', countryHint: 'BO', currencyCode: 'BOB' },
  { languageCode: 'nhe', countryHint: 'MX', currencyCode: 'MXN' },
  { languageCode: 'yua', countryHint: 'MX', currencyCode: 'MXN' },
  { languageCode: 'ht', countryHint: 'HT', currencyCode: 'HTG' },
  { languageCode: 'jam', countryHint: 'JM', currencyCode: 'JMD' },
  { languageCode: 'pap', countryHint: 'CW', currencyCode: 'ANG' },
  { languageCode: 'gcf', countryHint: 'GP', currencyCode: 'EUR' },
];


function honorificsFor(languageCode: string): HonorificEntry[] {
  const map: Record<string, HonorificEntry[]> = {
    th: [
      { form: 'คุณ', usage: 'Khun — polite title' },
      { form: 'ครับ / ค่ะ', usage: 'Politeness particles (krub/ka)' },
    ],
    vi: [
      { form: 'Anh / Chị', usage: 'Age-graded address' },
      { form: 'Ông / Bà', usage: 'Elder respect' },
    ],
    tl: [
      { form: 'po / opo', usage: 'Respect markers' },
      { form: 'Ginoo / Ginang', usage: 'Mr. / Mrs.' },
    ],
    hi: [
      { form: 'श्री / श्रीमती', usage: 'Mr. / Mrs.' },
      { form: 'जी', usage: 'Respect particle (ji)' },
    ],
    ta: [{ form: 'திரு / திருமதி', usage: 'Mr. / Mrs.' }],
    ht: [
      { form: 'Mesye / Madanm', usage: 'Mr. / Mrs.' },
      { form: 'tanpri', usage: 'Please (polite)' },
    ],
    qu: [{ form: 'Tayta / Mama', usage: 'Respectful elder address' }],
    es: [
      { form: 'Señor / Señora', usage: 'Mr. / Mrs.' },
      { form: 'usted', usage: 'Formal you' },
    ],
    pt: [{ form: 'Senhor / Senhora', usage: 'Mr. / Mrs.' }],
    ur: [{ form: 'جناب / محترمہ', usage: 'Mr. / Mrs. (respectful)' }],
    bn: [{ form: 'জনাব / বেगम', usage: 'Mr. / Mrs.' }],
    ms: [{ form: 'Encik / Puan', usage: 'Mr. / Mrs.' }],
  };
  return map[languageCode] ?? [];
}

function doNotTranslateFor(languageCode: string): string[] {
  const map: Record<string, string[]> = {
    th: ['Bangkok', 'VerbaLab', 'PromptPay'],
    vi: ['Ha Noi', 'Ho Chi Minh', 'VerbaLab'],
    tl: ['Manila', 'VerbaLab', 'GCash'],
    hi: ['India', 'Aadhaar', 'UPI', 'VerbaLab'],
    ht: ['Port-au-Prince', 'VerbaLab'],
    qu: ['Cusco', 'VerbaLab'],
    jam: ['Kingston', 'VerbaLab'],
    yue: ['Hong Kong', 'VerbaLab'],
  };
  return map[languageCode] ?? ['VerbaLab'];
}

function culturalNotesFor(languageCode: string, countryHint: string): string {
  const map: Record<string, string> = {
    th: 'Thai public copy should preserve krub/ka particles and soften refusals (mai pen rai). Keep royal/monastic titles stable.',
    vi: 'Vietnamese tones are meaning-bearing; kinship pronouns encode hierarchy — do not flatten casually.',
    tl: 'Tagalog/Filipino often mixes with English (Taglish); po/opo mark respect in citizen services.',
    ms: 'Bahasa Melayu formal register differs from particle-heavy colloquial speech.',
    hi: 'Hinglish is common in product UI; prefer respectful plural address in public-sector Hindi.',
    ta: 'Tamil respectful plural forms matter in formal address; keep personal names stable across scripts.',
    bn: 'Bangla script fidelity matters; Islamic greetings common in BD public life.',
    ur: 'Urdu requires RTL; English often co-presents in formal admin.',
    ht: 'Kreyol is everyday speech; French remains in legal/formal registers — offer both when needed.',
    jam: 'Jamaican English sits on a continuum with Patwa; civic UX may need both registers.',
    qu: 'Andean respectful address and communal framing matter in Quechua-speaking regions.',
    gn: 'Guarani is co-official in Paraguay; Jopara (mix with Spanish) is everyday speech.',
    yue: 'Cantonese is spoken everyday language; Traditional Chinese for written UI in HK.',
    es: `LatAm Spanish varies by country (${countryHint}) — do not force a single national register.`,
    pt: 'Brazilian Portuguese differs from European Portuguese; prefer BR norms for BR audiences.',
  };
  return (
    map[languageCode] ??
    `Strategic global locale pack for ${countryHint} — major-market culture hint for underserved voice markets.`
  );
}

export function buildGlobalLocalePackDefaults(
  existingLanguageCodes: Set<string>,
): LocalePackSeed[] {
  const packs: LocalePackSeed[] = [];
  const seen = new Set<string>(existingLanguageCodes);

  for (const row of GLOBAL_LOCALE_DEFAULTS) {
    if (seen.has(row.languageCode)) continue;
    seen.add(row.languageCode);
    packs.push({
      languageCode: row.languageCode,
      bcp47: `${row.languageCode}-${row.countryHint}`,
      dateNotes: 'Prefer locale-aware formatting; use ISO 8601 in APIs.',
      numberNotes: 'Western digits in digital UI unless script convention requires otherwise.',
      currencyCode: row.currencyCode,
      currencyNotes: `Representative currency ${row.currencyCode} for ${row.countryHint} audiences.`,
      honorifics: honorificsFor(row.languageCode),
      doNotTranslate: doNotTranslateFor(row.languageCode),
      culturalNotes: culturalNotesFor(row.languageCode, row.countryHint),
    });
  }

  return packs;
}
