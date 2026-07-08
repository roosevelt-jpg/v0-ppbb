/** Supported UI locales — used by language selector + Providers. */

export type SupportedLanguage = {
  code: string
  name: string
  nativeName: string
  rtl?: boolean
}

/** Major world languages (UAE/Gulf: Arabic with RTL). */
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', name: 'Mandarin Chinese', nativeName: '中文' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', rtl: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'id', name: 'Indonesian / Malay', nativeName: 'Bahasa Indonesia' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
]

export const SUPPORTED_LOCALE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code)

export const PREFERRED_LANGUAGE_KEY = 'preferred-language'

export function isRtlLocale(code: string): boolean {
  return SUPPORTED_LANGUAGES.some((l) => l.code === code && l.rtl)
}

export function filterLanguages(query: string, languages = SUPPORTED_LANGUAGES): SupportedLanguage[] {
  const q = query.trim().toLowerCase()
  if (!q) return languages
  return languages.filter(
    (lang) =>
      lang.code.toLowerCase().includes(q) ||
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q)
  )
}
