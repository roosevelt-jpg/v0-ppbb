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
      honorifics: [],
      doNotTranslate: ['VerbaLab'],
      culturalNotes:
        'Strategic global locale pack — major-market hint for underserved voice markets; deepen cultural notes per deployment.',
    });
  }

  return packs;
}
