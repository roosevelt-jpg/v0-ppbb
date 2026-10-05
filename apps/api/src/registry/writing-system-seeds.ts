export type WritingSystemSeed = {
  code: string;
  nameEn: string;
  kind: 'alphabet' | 'abjad' | 'abugida' | 'syllabary' | 'logographic' | 'other';
  rtl?: boolean;
  sampleChars?: string;
  notes?: string;
};

/** ISO 15924 writing systems / scripts / alphabets used by the registry (VL-139). */
export const WRITING_SYSTEM_SEEDS: WritingSystemSeed[] = [
  {
    code: 'Latn',
    nameEn: 'Latin',
    kind: 'alphabet',
    sampleChars: 'AaBbCc',
    notes: 'Default alphabet for most vendor and African Latin orthographies.',
  },
  {
    code: 'Arab',
    nameEn: 'Arabic',
    kind: 'abjad',
    rtl: true,
    sampleChars: 'ابجد',
  },
  {
    code: 'Ethi',
    nameEn: 'Ethiopic (Geʻez)',
    kind: 'abugida',
    sampleChars: 'አማ',
    notes: 'Used by Amharic in the strategic African set.',
  },
  {
    code: 'Cyrl',
    nameEn: 'Cyrillic',
    kind: 'alphabet',
    sampleChars: 'АаБб',
  },
  {
    code: 'Deva',
    nameEn: 'Devanagari',
    kind: 'abugida',
    sampleChars: 'अआइ',
  },
  {
    code: 'Hans',
    nameEn: 'Han (Simplified)',
    kind: 'logographic',
    sampleChars: '汉字',
  },
  {
    code: 'Hant',
    nameEn: 'Han (Traditional)',
    kind: 'logographic',
    sampleChars: '漢字',
  },
  {
    code: 'Jpan',
    nameEn: 'Japanese (alias)',
    kind: 'other',
    sampleChars: 'あア漢',
    notes: 'Alias covering Hiragana/Katakana/Kanji mix for registry linkage.',
  },
  {
    code: 'Kore',
    nameEn: 'Korean (Hangul)',
    kind: 'alphabet',
    sampleChars: '한글',
  },
  {
    code: 'Grek',
    nameEn: 'Greek',
    kind: 'alphabet',
    sampleChars: 'ΑαΒβ',
  },
  {
    code: 'Hebr',
    nameEn: 'Hebrew',
    kind: 'abjad',
    rtl: true,
    sampleChars: 'אבג',
  },
  { code: 'Thai', nameEn: 'Thai', kind: 'abugida', sampleChars: 'กขค' },
  { code: 'Laoo', nameEn: 'Lao', kind: 'abugida', sampleChars: 'ກຂຄ' },
  { code: 'Khmr', nameEn: 'Khmer', kind: 'abugida', sampleChars: 'កខគ' },
  { code: 'Mymr', nameEn: 'Myanmar (Burmese)', kind: 'abugida', sampleChars: 'ကခဂ' },
  { code: 'Taml', nameEn: 'Tamil', kind: 'abugida', sampleChars: 'அஆஇ' },
  { code: 'Telu', nameEn: 'Telugu', kind: 'abugida', sampleChars: 'అఆఇ' },
  { code: 'Knda', nameEn: 'Kannada', kind: 'abugida', sampleChars: 'ಅಆಇ' },
  { code: 'Mlym', nameEn: 'Malayalam', kind: 'abugida', sampleChars: 'അആഇ' },
  { code: 'Guru', nameEn: 'Gurmukhi', kind: 'abugida', sampleChars: 'ਅਆਇ' },
  { code: 'Gujr', nameEn: 'Gujarati', kind: 'abugida', sampleChars: 'અઆઇ' },
  { code: 'Orya', nameEn: 'Odia (Oriya)', kind: 'abugida', sampleChars: 'ଅଆଇ' },
  { code: 'Beng', nameEn: 'Bengali', kind: 'abugida', sampleChars: 'অআই' },
  { code: 'Sinh', nameEn: 'Sinhala', kind: 'abugida', sampleChars: 'අආඇ' },
];
