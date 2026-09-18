# Internationalization (i18n)

Passive Blessings translates the **entire site** (UI chrome, CMS pages, dashboards, modals, and dynamic content) using Google Website Translator, driven by the language selector.

## How it works

1. User picks a language in the globe selector (`components/language-selector.tsx`).
2. Preference is stored in `localStorage` (`preferred-language`) and the `googtrans` cookie.
3. Page reloads; `SiteTranslator` loads Google Translate and applies the language to the full DOM.
4. Client navigations and late-loaded content are re-translated automatically.
5. Arabic / Urdu also set `dir="rtl"` and use **Noto Sans Arabic** for readable layout.

Supported locales: see `lib/supported-languages.ts` (English, Arabic, French, Spanish, Portuguese, Chinese, Hindi, Urdu, Russian, German, Turkish, Indonesian, Bengali, Japanese, Korean, Swahili, Italian, Dutch).

## Key files

| File | Role |
|------|------|
| `lib/site-translate.ts` | Cookie sync, Google Translate API helpers |
| `components/site-translator.tsx` | Hidden widget + re-apply on route/DOM changes |
| `components/language-selector.tsx` | User-facing language picker |
| `app/providers.tsx` | Locale + RTL + mounts `SiteTranslator` |
| `messages/*.json` | Optional next-intl catalogs (supplementary) |

## Notes

- Switching back to **English** clears the translate cookie and reloads the original page.
- The language picker itself uses `notranslate` so language names stay readable.
- Password / email / code fields stay in original form for usability.
- Google’s top translate banner is hidden via CSS for a clean UI.
- Machine translation covers *all* visible text, including CMS. For legal/policy pages, prefer human review of critical copy over time.

## Do not

- Rely on `messages/*.json` alone — catalogs are incomplete vs the full app surface.
- Show the Google Translate iframe banner (CSS already hides it).
