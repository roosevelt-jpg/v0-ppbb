/** Site-wide page translation via Google Translate (covers UI + CMS + dynamic text). */

import { PREFERRED_LANGUAGE_KEY, SUPPORTED_LOCALE_CODES, isRtlLocale } from '@/lib/supported-languages'

/** Map our locale codes → Google Translate language codes */
export const GOOGLE_TRANSLATE_LANG: Record<string, string> = {
  en: 'en',
  ar: 'ar',
  fr: 'fr',
  es: 'es',
  pt: 'pt',
  zh: 'zh-CN',
  hi: 'hi',
  ur: 'ur',
  ru: 'ru',
  de: 'de',
  tr: 'tr',
  id: 'id',
  bn: 'bn',
  ja: 'ja',
  ko: 'ko',
  sw: 'sw',
  it: 'it',
  nl: 'nl',
}

export const GOOGLE_TRANSLATE_INCLUDED = Object.values(GOOGLE_TRANSLATE_LANG)
  .filter((c, i, arr) => arr.indexOf(c) === i && c !== 'en')
  .join(',')

declare global {
  interface Window {
    googleTranslateElementInit?: () => void
    google?: {
      translate?: {
        TranslateElement: new (
          options: {
            pageLanguage: string
            includedLanguages?: string
            autoDisplay?: boolean
            multilanguagePage?: boolean
          },
          elementId: string
        ) => void
      }
    }
  }
}

function cookieDomain(): string | null {
  if (typeof window === 'undefined') return null
  const host = window.location.hostname
  if (!host || host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null
  const parts = host.split('.')
  if (parts.length < 2) return null
  return `.${parts.slice(-2).join('.')}`
}

/** Read / write googtrans cookie Google Translate uses. */
export function setGoogTransCookie(locale: string) {
  if (typeof document === 'undefined') return
  const gt = GOOGLE_TRANSLATE_LANG[locale] || locale
  const value = !locale || locale === 'en' ? '' : `/en/${gt}`

  const expire = value
    ? ''
    : ';expires=Thu, 01 Jan 1970 00:00:00 GMT'

  document.cookie = `googtrans=${value}${expire};path=/`
  const domain = cookieDomain()
  if (domain) {
    document.cookie = `googtrans=${value}${expire};path=/;domain=${domain}`
  }
  // Some browsers also use googtrans without path variants
  document.cookie = `googtrans=${value}${expire};path=/;SameSite=Lax`
}

export function getPreferredLocale(): string {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(PREFERRED_LANGUAGE_KEY) || 'en'
  return SUPPORTED_LOCALE_CODES.includes(stored) ? stored : 'en'
}

export function persistPreferredLocale(locale: string) {
  if (typeof window === 'undefined') return
  const code = SUPPORTED_LOCALE_CODES.includes(locale) ? locale : 'en'
  localStorage.setItem(PREFERRED_LANGUAGE_KEY, code)
  localStorage.setItem('preferredLanguage', code)
  setGoogTransCookie(code)
  const dir = isRtlLocale(code) ? 'rtl' : 'ltr'
  document.documentElement.setAttribute('dir', dir)
  document.documentElement.setAttribute('lang', code)
  document.documentElement.classList.toggle('pb-rtl', isRtlLocale(code))
  document.documentElement.classList.toggle('pb-translated', code !== 'en')
}

function findGoogleCombo(): HTMLSelectElement | null {
  return document.querySelector('.goog-te-combo') as HTMLSelectElement | null
}

/** Force Google Translate combo to a language (empty string = original English). */
export function triggerGoogleTranslate(locale: string): boolean {
  const combo = findGoogleCombo()
  if (!combo) return false

  const target = locale === 'en' ? '' : GOOGLE_TRANSLATE_LANG[locale] || locale
  if (combo.value === target) {
    // Still dispatch so newly mounted DOM gets picked up after SPA navigations
    combo.dispatchEvent(new Event('change'))
    return true
  }
  combo.value = target
  combo.dispatchEvent(new Event('change'))
  return true
}

let scriptLoading: Promise<void> | null = null

export function ensureGoogleTranslateScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.translate?.TranslateElement) return Promise.resolve()
  if (scriptLoading) return scriptLoading

  scriptLoading = new Promise((resolve, reject) => {
    const existing = document.getElementById('pb-google-translate-script')
    if (existing) {
      const check = () => {
        if (window.google?.translate?.TranslateElement) resolve()
        else setTimeout(check, 50)
      }
      check()
      return
    }

    window.googleTranslateElementInit = () => {
      try {
        const host = document.getElementById('pb-google-translate-element')
        if (host && window.google?.translate?.TranslateElement) {
          // eslint-disable-next-line no-new
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: `en,${GOOGLE_TRANSLATE_INCLUDED}`,
              autoDisplay: false,
              multilanguagePage: true,
            },
            'pb-google-translate-element'
          )
        }
      } catch (err) {
        console.warn('[site-translate] TranslateElement init failed', err)
      }
      resolve()
    }

    const script = document.createElement('script')
    script.id = 'pb-google-translate-script'
    script.src =
      'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.async = true
    script.onerror = () => {
      scriptLoading = null
      reject(new Error('Failed to load Google Translate'))
    }
    document.body.appendChild(script)
  })

  return scriptLoading
}

/** Apply preferred language to the live page (assumes TranslateElement is ready). */
export async function applySiteTranslation(locale?: string): Promise<void> {
  const code = locale || getPreferredLocale()
  persistPreferredLocale(code)

  if (code === 'en') {
    setGoogTransCookie('en')
    // Clearing translation requires a clean document — combo '' often works mid-session
    triggerGoogleTranslate('en')
    return
  }

  await ensureGoogleTranslateScript()

  // Wait briefly for combo to appear after init
  for (let i = 0; i < 40; i++) {
    if (triggerGoogleTranslate(code)) return
    await new Promise((r) => setTimeout(r, 100))
  }
  console.warn('[site-translate] Google Translate combo not ready')
}

/**
 * Switch language from the UI selector.
 * Sets cookies + preference, then reloads so Google Translate applies cleanly to the full DOM.
 */
export function switchSiteLanguage(locale: string) {
  persistPreferredLocale(locale)
  setGoogTransCookie(locale)
  window.location.reload()
}
