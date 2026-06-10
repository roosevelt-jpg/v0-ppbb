# Internationalization (i18n) Guide

## Overview

Passive Blessings supports **12 languages** with automatic browser language detection and per-user language selection. The platform uses **next-intl** for translations with Firestore for user language preferences.

## Supported Languages

1. **English** (en)
2. **Arabic** (ar) - Right-to-left support
3. **Spanish** (es)
4. **French** (fr)
5. **German** (de)
6. **Portuguese** (pt)
7. **Japanese** (ja)
8. **Chinese** (zh)
9. **Korean** (ko)
10. **Italian** (it)
11. **Dutch** (nl)
12. **Russian** (ru)

## Architecture

### File Structure

```
/vercel/share/v0-project/
├── messages/
│   ├── en.json          # English messages
│   ├── ar.json          # Arabic messages (RTL)
│   ├── es.json          # Spanish messages
│   ├── fr.json          # French messages
│   ├── de.json          # German messages
│   ├── pt.json          # Portuguese messages
│   ├── ja.json          # Japanese messages
│   ├── zh.json          # Chinese messages
│   ├── ko.json          # Korean messages
│   ├── it.json          # Italian messages
│   ├── nl.json          # Dutch messages
│   └── ru.json          # Russian messages
├── lib/
│   └── i18n.ts          # i18n configuration
├── app/
│   └── providers.tsx     # NextIntlClientProvider setup
└── next-intl.config.json # i18n configuration
```

### Configuration

#### next-intl.config.json
- Defines supported locales (12 languages)
- Sets default locale to 'en'
- Enables locale detection

#### lib/i18n.ts
- `getTranslations()` - Server-side translations
- `useTranslations()` - Client-side translations
- `getLocale()` - Get current locale
- Locale detection helpers

#### app/providers.tsx
- `NextIntlClientProvider` wraps all client components
- Browser language auto-detection on mount
- Fallback to 'en' if browser language not supported

## Usage

### In Server Components

```typescript
import { useTranslations } from 'next-intl'

export default function MyPage() {
  const t = useTranslations()
  
  return <h1>{t('signup.title')}</h1>
}
```

### In Client Components

```typescript
'use client'

import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations()
  
  return <button>{t('common.continue')}</button>
}
```

### Message File Format

Each language file contains a flat key structure:

```json
{
  "signup.title": "Create your account",
  "signup.step1.label": "User type",
  "signup.step2.label": "Personal info",
  "common.continue": "Continue",
  "common.back": "Back",
  "errors.required": "This field is required"
}
```

## Language Switching

### Automatic Detection
- Browser language detected on page load
- Falls back to English if not supported
- Stored in user preference

### Manual Selection
- Language switcher component in navbar (when implemented)
- Updates stored in Firestore user settings
- Persists across sessions

## Translation Keys

### Current Message Categories

- `common.*` - Button labels, general UI
- `signup.*` - Signup form messages
- `navigation.*` - Navigation labels
- `errors.*` - Error messages
- `validation.*` - Validation feedback
- `auth.*` - Authentication messages
- `dashboard.*` - Dashboard labels
- `admin.*` - Admin panel messages
- `profile.*` - User profile labels
- `events.*` - Events-related text

## Adding New Languages

1. Create new language file: `messages/[locale].json`
2. Copy structure from `messages/en.json`
3. Translate all keys
4. Add locale to `next-intl.config.json`
5. Test with language switcher

Example: Add Spanish (if not exists)
```bash
cp messages/en.json messages/es.json
# Edit messages/es.json with Spanish translations
```

## Updating Translations

1. Edit `messages/en.json` with new keys
2. Update all other language files with translations
3. Use keys in components: `t('new.key')`
4. No rebuild required for existing keys
5. New keys may need app restart

## Right-to-Left (RTL) Languages

Arabic (ar) is the only RTL language currently:

- Direction automatically set via CSS `dir="rtl"`
- Flexbox layouts reverse naturally
- Text alignment handled automatically
- Padding/margin adjust for RTL

To add RTL support to new languages, update CSS direction in the layout.

## Performance

- Lazy load translations per route
- No runtime translation computation
- Type-safe keys via next-intl
- Translations bundled with app

## Troubleshooting

### Translations Not Showing
1. Verify message key exists in language file
2. Check NextIntlClientProvider is wrapping component
3. Ensure locale is passed to provider
4. Verify import statement: `import { useTranslations } from 'next-intl'`

### Wrong Language Displayed
1. Check browser language settings
2. Verify `next-intl.config.json` includes language
3. Check `messages/[locale].json` file exists
4. Force browser language to test

### Build Errors
1. Verify JSON format in all message files
2. Ensure no trailing commas in JSON
3. Check all locales in config have message files

## Firestore Integration

User language preferences stored in:
- Collection: `users`
- Field: `preferredLanguage`
- Type: string (locale code)

## Future Enhancements

1. Language selector dropdown in navbar
2. Persist language choice to Firestore
3. Server-side language detection from URL params
4. Translation management admin panel
5. Automated translation updates
6. Language-specific formatting (dates, numbers, currency)

## Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app)
- [Message Format Reference](https://next-intl-docs.vercel.app/docs/getting-started/app-router)
- [RTL Support Guide](https://next-intl-docs.vercel.app/docs/environment-variables/rtl)
