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
 * Default locale-pack hints for strategic African languages without a hand-written pack.
 * Currency/country hints are representative major markets — not exclusive territorial claims.
 */
const AFRICA_LOCALE_DEFAULTS: Array<{
  languageCode: string;
  countryHint: string;
  currencyCode: string;
  dateNotes?: string;
  numberNotes?: string;
}> = [
  { languageCode: 'zu', countryHint: 'ZA', currencyCode: 'ZAR' },
  { languageCode: 'ig', countryHint: 'NG', currencyCode: 'NGN' },
  { languageCode: 'so', countryHint: 'SO', currencyCode: 'SOS' },
  { languageCode: 'rw', countryHint: 'RW', currencyCode: 'RWF' },
  { languageCode: 'af', countryHint: 'ZA', currencyCode: 'ZAR' },
  { languageCode: 'wo', countryHint: 'SN', currencyCode: 'XOF' },
  { languageCode: 'ar', countryHint: 'EG', currencyCode: 'EGP' },
  { languageCode: 'ak', countryHint: 'GH', currencyCode: 'GHS' },
  { languageCode: 'ee', countryHint: 'GH', currencyCode: 'GHS' },
  { languageCode: 'xh', countryHint: 'ZA', currencyCode: 'ZAR' },
  { languageCode: 'ln', countryHint: 'CD', currencyCode: 'CDF' },
  { languageCode: 'bm', countryHint: 'ML', currencyCode: 'XOF' },
  { languageCode: 'ff', countryHint: 'SN', currencyCode: 'XOF' },
  { languageCode: 'om', countryHint: 'ET', currencyCode: 'ETB' },
  { languageCode: 'ti', countryHint: 'ET', currencyCode: 'ETB' },
  { languageCode: 'ny', countryHint: 'MW', currencyCode: 'MWK' },
  { languageCode: 'sn', countryHint: 'ZW', currencyCode: 'ZWL' },
  { languageCode: 'lg', countryHint: 'UG', currencyCode: 'UGX' },
  { languageCode: 'pt', countryHint: 'AO', currencyCode: 'AOA' },
  { languageCode: 'ber', countryHint: 'MA', currencyCode: 'MAD' },
  { languageCode: 'kab', countryHint: 'DZ', currencyCode: 'DZD' },
  { languageCode: 'tzm', countryHint: 'MA', currencyCode: 'MAD' },
  { languageCode: 'ha', countryHint: 'NG', currencyCode: 'NGN' },
  { languageCode: 'tw', countryHint: 'GH', currencyCode: 'GHS' },
  { languageCode: 'gaa', countryHint: 'GH', currencyCode: 'GHS' },
  { languageCode: 'dag', countryHint: 'GH', currencyCode: 'GHS' },
  { languageCode: 'nso', countryHint: 'ZA', currencyCode: 'ZAR' },
  { languageCode: 'tn', countryHint: 'BW', currencyCode: 'BWP' },
  { languageCode: 'st', countryHint: 'LS', currencyCode: 'LSL' },
  { languageCode: 'ss', countryHint: 'SZ', currencyCode: 'SZL' },
  { languageCode: 'ts', countryHint: 'ZA', currencyCode: 'ZAR' },
  { languageCode: 've', countryHint: 'ZA', currencyCode: 'ZAR' },
  { languageCode: 'nr', countryHint: 'ZA', currencyCode: 'ZAR' },
  { languageCode: 'nd', countryHint: 'ZW', currencyCode: 'ZWL' },
  { languageCode: 'rn', countryHint: 'BI', currencyCode: 'BIF' },
  { languageCode: 'kg', countryHint: 'CD', currencyCode: 'CDF' },
  { languageCode: 'lu', countryHint: 'CD', currencyCode: 'CDF' },
  { languageCode: 'sg', countryHint: 'CF', currencyCode: 'XAF' },
  { languageCode: 'mg', countryHint: 'MG', currencyCode: 'MGA' },
  { languageCode: 'swc', countryHint: 'CD', currencyCode: 'CDF' },
  { languageCode: 'shi', countryHint: 'MA', currencyCode: 'MAD' },
  { languageCode: 'zgh', countryHint: 'MA', currencyCode: 'MAD' },
  { languageCode: 'rif', countryHint: 'MA', currencyCode: 'MAD' },
  { languageCode: 'ki', countryHint: 'KE', currencyCode: 'KES' },
  { languageCode: 'luo', countryHint: 'KE', currencyCode: 'KES' },
  { languageCode: 'kam', countryHint: 'KE', currencyCode: 'KES' },
  { languageCode: 'guz', countryHint: 'KE', currencyCode: 'KES' },
  { languageCode: 'mer', countryHint: 'KE', currencyCode: 'KES' },
  { languageCode: 'kr', countryHint: 'NG', currencyCode: 'NGN' },
  { languageCode: 'mos', countryHint: 'BF', currencyCode: 'XOF' },
  { languageCode: 'dyu', countryHint: 'CI', currencyCode: 'XOF' },
  { languageCode: 'fon', countryHint: 'BJ', currencyCode: 'XOF' },
  { languageCode: 'kbp', countryHint: 'TG', currencyCode: 'XOF' },
  { languageCode: 'mnk', countryHint: 'GM', currencyCode: 'GMD' },
  { languageCode: 'snk', countryHint: 'ML', currencyCode: 'XOF' },
  { languageCode: 'dje', countryHint: 'NE', currencyCode: 'XOF' },
  { languageCode: 'pcm', countryHint: 'NG', currencyCode: 'NGN' },
  { languageCode: 'kri', countryHint: 'SL', currencyCode: 'SLE' },
  { languageCode: 'tem', countryHint: 'SL', currencyCode: 'SLE' },
  { languageCode: 'men', countryHint: 'SL', currencyCode: 'SLE' },
  { languageCode: 'sus', countryHint: 'GN', currencyCode: 'GNF' },
  { languageCode: 'fan', countryHint: 'GA', currencyCode: 'XAF' },
  { languageCode: 'dua', countryHint: 'CM', currencyCode: 'XAF' },
  { languageCode: 'ewo', countryHint: 'CM', currencyCode: 'XAF' },
  { languageCode: 'bem', countryHint: 'ZM', currencyCode: 'ZMW' },
  { languageCode: 'toi', countryHint: 'ZM', currencyCode: 'ZMW' },
  { languageCode: 'loz', countryHint: 'ZM', currencyCode: 'ZMW' },
  { languageCode: 'tum', countryHint: 'MW', currencyCode: 'MWK' },
  { languageCode: 'yao', countryHint: 'MW', currencyCode: 'MWK' },
  { languageCode: 'umb', countryHint: 'AO', currencyCode: 'AOA' },
  { languageCode: 'kmb', countryHint: 'AO', currencyCode: 'AOA' },
  { languageCode: 'kj', countryHint: 'NA', currencyCode: 'NAD' },
  { languageCode: 'ng', countryHint: 'NA', currencyCode: 'NAD' },
  { languageCode: 'her', countryHint: 'NA', currencyCode: 'NAD' },
  { languageCode: 'naq', countryHint: 'NA', currencyCode: 'NAD' },
  { languageCode: 'vmw', countryHint: 'MZ', currencyCode: 'MZN' },
  { languageCode: 'din', countryHint: 'SS', currencyCode: 'SSP' },
  { languageCode: 'nus', countryHint: 'SS', currencyCode: 'SSP' },
  { languageCode: 'aa', countryHint: 'DJ', currencyCode: 'DJF' },
  { languageCode: 'tig', countryHint: 'ER', currencyCode: 'ERN' },
  { languageCode: 'ach', countryHint: 'UG', currencyCode: 'UGX' },
  { languageCode: 'teo', countryHint: 'UG', currencyCode: 'UGX' },
  { languageCode: 'nyn', countryHint: 'UG', currencyCode: 'UGX' },
  { languageCode: 'myx', countryHint: 'UG', currencyCode: 'UGX' },
  { languageCode: 'mas', countryHint: 'KE', currencyCode: 'KES' },
  { languageCode: 'kln', countryHint: 'KE', currencyCode: 'KES' },
  { languageCode: 'suk', countryHint: 'TZ', currencyCode: 'TZS' },
  { languageCode: 'mfe', countryHint: 'MU', currencyCode: 'MUR' },
  { languageCode: 'crs', countryHint: 'SC', currencyCode: 'SCR' },
  { languageCode: 'kea', countryHint: 'CV', currencyCode: 'CVE' },
  { languageCode: 'cri', countryHint: 'ST', currencyCode: 'STN' },
  { languageCode: 'pov', countryHint: 'GW', currencyCode: 'XOF' },
  { languageCode: 'zdj', countryHint: 'KM', currencyCode: 'KMF' },
  { languageCode: 'tmh', countryHint: 'ML', currencyCode: 'XOF' },
  { languageCode: 'bci', countryHint: 'CI', currencyCode: 'XOF' },
  { languageCode: 'fat', countryHint: 'GH', currencyCode: 'GHS' },
  { languageCode: 'ada', countryHint: 'GH', currencyCode: 'GHS' },
  { languageCode: 'nzi', countryHint: 'GH', currencyCode: 'GHS' },
  { languageCode: 'gjn', countryHint: 'GH', currencyCode: 'GHS' },
  { languageCode: 'xsm', countryHint: 'GH', currencyCode: 'GHS' },
  { languageCode: 'tiv', countryHint: 'NG', currencyCode: 'NGN' },
  { languageCode: 'ibb', countryHint: 'NG', currencyCode: 'NGN' },
  { languageCode: 'efi', countryHint: 'NG', currencyCode: 'NGN' },
  { languageCode: 'bin', countryHint: 'NG', currencyCode: 'NGN' },
  { languageCode: 'lua', countryHint: 'CD', currencyCode: 'CDF' },
  { languageCode: 'ngl', countryHint: 'MZ', currencyCode: 'MZN' },
  { languageCode: 'seh', countryHint: 'MZ', currencyCode: 'MZN' },
  { languageCode: 'fuv', countryHint: 'NG', currencyCode: 'NGN' },
  { languageCode: 'fuc', countryHint: 'SN', currencyCode: 'XOF' },
  { languageCode: 'man', countryHint: 'GN', currencyCode: 'GNF' },
  { languageCode: 'lgg', countryHint: 'UG', currencyCode: 'UGX' },
  { languageCode: 'cgg', countryHint: 'UG', currencyCode: 'UGX' },
  { languageCode: 'xog', countryHint: 'UG', currencyCode: 'UGX' },
  { languageCode: 'sid', countryHint: 'ET', currencyCode: 'ETB' },
  { languageCode: 'wal', countryHint: 'ET', currencyCode: 'ETB' },
  { languageCode: 'gez', countryHint: 'ET', currencyCode: 'ETB' },
  { languageCode: 'kck', countryHint: 'ZW', currencyCode: 'ZWL' },
  { languageCode: 'ndc', countryHint: 'ZW', currencyCode: 'ZWL' },
  { languageCode: 'fvr', countryHint: 'SD', currencyCode: 'SDG' },
  { languageCode: 'zag', countryHint: 'SD', currencyCode: 'SDG' },
  { languageCode: 'mls', countryHint: 'SD', currencyCode: 'SDG' },
  { languageCode: 'shk', countryHint: 'SS', currencyCode: 'SSP' },
  { languageCode: 'anu', countryHint: 'SS', currencyCode: 'SSP' },
  { languageCode: 'wni', countryHint: 'KM', currencyCode: 'KMF' },
  { languageCode: 'ses', countryHint: 'ML', currencyCode: 'XOF' },
  { languageCode: 'sef', countryHint: 'CI', currencyCode: 'XOF' },
  { languageCode: 'dnj', countryHint: 'CI', currencyCode: 'XOF' },
  { languageCode: 'any', countryHint: 'CI', currencyCode: 'XOF' },
  { languageCode: 'kpe', countryHint: 'LR', currencyCode: 'LRD' },
  { languageCode: 'vai', countryHint: 'LR', currencyCode: 'LRD' },
  { languageCode: 'bba', countryHint: 'BJ', currencyCode: 'XOF' },
  { languageCode: 'gur', countryHint: 'GH', currencyCode: 'GHS' },
  { languageCode: 'dga', countryHint: 'GH', currencyCode: 'GHS' },
  { languageCode: 'bas', countryHint: 'CM', currencyCode: 'XAF' },
  { languageCode: 'bum', countryHint: 'CM', currencyCode: 'XAF' },
  { languageCode: 'lol', countryHint: 'CD', currencyCode: 'CDF' },
  { languageCode: 'tll', countryHint: 'CD', currencyCode: 'CDF' },
  { languageCode: 'urh', countryHint: 'NG', currencyCode: 'NGN' },
  { languageCode: 'ijc', countryHint: 'NG', currencyCode: 'NGN' },
  { languageCode: 'ffm', countryHint: 'ML', currencyCode: 'XOF' },
  { languageCode: 'luy', countryHint: 'KE', currencyCode: 'KES' },
  { languageCode: 'hay', countryHint: 'TZ', currencyCode: 'TZS' },
  { languageCode: 'nym', countryHint: 'TZ', currencyCode: 'TZS' },
  { languageCode: 'bez', countryHint: 'TZ', currencyCode: 'TZS' },
  { languageCode: 'gog', countryHint: 'TZ', currencyCode: 'TZS' },
  { languageCode: 'heh', countryHint: 'TZ', currencyCode: 'TZS' },
  { languageCode: 'nyo', countryHint: 'UG', currencyCode: 'UGX' },
  { languageCode: 'ttj', countryHint: 'UG', currencyCode: 'UGX' },
];

/** Build default packs; caller must skip languageCodes already present in curated packs. */
export function buildAfricaLocalePackDefaults(
  existingLanguageCodes: Set<string>,
): LocalePackSeed[] {
  const packs: LocalePackSeed[] = [];
  const seen = new Set<string>(existingLanguageCodes);

  for (const row of AFRICA_LOCALE_DEFAULTS) {
    if (seen.has(row.languageCode)) continue;
    seen.add(row.languageCode);
    packs.push({
      languageCode: row.languageCode,
      bcp47: `${row.languageCode}-${row.countryHint}`,
      dateNotes:
        row.dateNotes ??
        'DMY common in regional administration; prefer ISO 8601 in APIs.',
      numberNotes:
        row.numberNotes ??
        'Arabic digits in digital UI; follow regional decimal conventions when known.',
      currencyCode: row.currencyCode,
      currencyNotes: `Representative currency ${row.currencyCode} for ${row.countryHint} audiences using this language.`,
      honorifics: [],
      doNotTranslate: ['VerbaLab'],
      culturalNotes:
        'Curated Africa-default locale pack — major-market hint only; expand with hand-written cultural notes when targeting this language seriously.',
    });
  }

  return packs;
}
