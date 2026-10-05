import type { LanguageSeed } from './language-seeds';

/**
 * Strategic global languages — SEA, India, LatAm indigenous, Caribbean creoles.
 * Catalog coverage for markets under-served by mainstream voice platforms.
 */
export const GLOBAL_LANGUAGE_SEEDS: LanguageSeed[] = [
  // Southeast Asia
  { code: 'th', nameEn: 'Thai', nameNative: 'Thai', script: 'Thai', familyCode: 'tai_kadai', tier: 'strategic_global' },
  { code: 'vi', nameEn: 'Vietnamese', nameNative: 'Tieng Viet', script: 'Latn', familyCode: 'austroasiatic', tier: 'strategic_global' },
  { code: 'tl', nameEn: 'Tagalog / Filipino', nameNative: 'Tagalog', script: 'Latn', familyCode: 'austronesian', tier: 'strategic_global' },
  { code: 'ms', nameEn: 'Malay', nameNative: 'Bahasa Melayu', script: 'Latn', familyCode: 'austronesian', tier: 'strategic_global' },
  { code: 'km', nameEn: 'Khmer', nameNative: 'Khmer', script: 'Khmr', familyCode: 'austroasiatic', tier: 'strategic_global' },
  { code: 'lo', nameEn: 'Lao', nameNative: 'Lao', script: 'Laoo', familyCode: 'tai_kadai', tier: 'strategic_global' },
  { code: 'my', nameEn: 'Burmese', nameNative: 'Burmese', script: 'Mymr', familyCode: 'sino_tibetan', tier: 'strategic_global' },
  { code: 'jv', nameEn: 'Javanese', nameNative: 'Basa Jawa', script: 'Latn', familyCode: 'austronesian', tier: 'strategic_global' },
  { code: 'su', nameEn: 'Sundanese', nameNative: 'Basa Sunda', script: 'Latn', familyCode: 'austronesian', tier: 'strategic_global' },
  { code: 'ceb', nameEn: 'Cebuano', nameNative: 'Sinugboanon', script: 'Latn', familyCode: 'austronesian', tier: 'strategic_global' },
  { code: 'hil', nameEn: 'Hiligaynon', nameNative: 'Ilonggo', script: 'Latn', familyCode: 'austronesian', tier: 'strategic_global' },
  { code: 'war', nameEn: 'Waray', nameNative: 'Winaray', script: 'Latn', familyCode: 'austronesian', tier: 'strategic_global' },
  { code: 'yue', nameEn: 'Cantonese', nameNative: 'Cantonese', script: 'Hant', familyCode: 'sino_tibetan', tier: 'strategic_global' },

  // India / South Asia
  { code: 'bn', nameEn: 'Bengali', nameNative: 'Bangla', script: 'Beng', familyCode: 'indo_european', tier: 'strategic_global' },
  { code: 'ta', nameEn: 'Tamil', nameNative: 'Tamil', script: 'Taml', familyCode: 'dravidian', tier: 'strategic_global' },
  { code: 'te', nameEn: 'Telugu', nameNative: 'Telugu', script: 'Telu', familyCode: 'dravidian', tier: 'strategic_global' },
  { code: 'mr', nameEn: 'Marathi', nameNative: 'Marathi', script: 'Deva', familyCode: 'indo_european', tier: 'strategic_global' },
  { code: 'gu', nameEn: 'Gujarati', nameNative: 'Gujarati', script: 'Gujr', familyCode: 'indo_european', tier: 'strategic_global' },
  { code: 'kn', nameEn: 'Kannada', nameNative: 'Kannada', script: 'Knda', familyCode: 'dravidian', tier: 'strategic_global' },
  { code: 'ml', nameEn: 'Malayalam', nameNative: 'Malayalam', script: 'Mlym', familyCode: 'dravidian', tier: 'strategic_global' },
  { code: 'pa', nameEn: 'Punjabi', nameNative: 'Punjabi', script: 'Guru', familyCode: 'indo_european', tier: 'strategic_global' },
  { code: 'or', nameEn: 'Odia', nameNative: 'Odia', script: 'Orya', familyCode: 'indo_european', tier: 'strategic_global' },
  { code: 'as', nameEn: 'Assamese', nameNative: 'Assamese', script: 'Beng', familyCode: 'indo_european', tier: 'strategic_global' },
  { code: 'ur', nameEn: 'Urdu', nameNative: 'Urdu', script: 'Arab', familyCode: 'indo_european', rtl: true, tier: 'strategic_global' },
  { code: 'ne', nameEn: 'Nepali', nameNative: 'Nepali', script: 'Deva', familyCode: 'indo_european', tier: 'strategic_global' },
  { code: 'si', nameEn: 'Sinhala', nameNative: 'Sinhala', script: 'Sinh', familyCode: 'indo_european', tier: 'strategic_global' },
  { code: 'bho', nameEn: 'Bhojpuri', nameNative: 'Bhojpuri', script: 'Deva', familyCode: 'indo_european', tier: 'strategic_global' },

  // Latin America indigenous
  { code: 'qu', nameEn: 'Quechua', nameNative: 'Runa Simi', script: 'Latn', familyCode: 'quechuan', tier: 'strategic_global' },
  { code: 'gn', nameEn: 'Guarani', nameNative: "Avane'e", script: 'Latn', familyCode: 'tupian', tier: 'strategic_global' },
  { code: 'ay', nameEn: 'Aymara', nameNative: 'Aymar aru', script: 'Latn', familyCode: 'aymaran', tier: 'strategic_global' },
  { code: 'nhe', nameEn: 'Eastern Huasteca Nahuatl', nameNative: 'Nahuatl', script: 'Latn', familyCode: 'uto_aztecan', tier: 'strategic_global' },
  { code: 'yua', nameEn: 'Yucatec Maya', nameNative: "Maaya t'aan", script: 'Latn', familyCode: 'mayan', tier: 'strategic_global' },

  // Caribbean creoles
  { code: 'ht', nameEn: 'Haitian Creole', nameNative: 'Kreyol ayisyen', script: 'Latn', familyCode: 'creole', tier: 'strategic_global' },
  { code: 'jam', nameEn: 'Jamaican Creole', nameNative: 'Patwa', script: 'Latn', familyCode: 'creole', tier: 'strategic_global' },
  { code: 'pap', nameEn: 'Papiamento', nameNative: 'Papiamentu', script: 'Latn', familyCode: 'creole', tier: 'strategic_global' },
  { code: 'gcf', nameEn: 'Guadeloupean Creole', nameNative: 'Kreyol Gwadloup', script: 'Latn', familyCode: 'creole', tier: 'strategic_global' },
];
