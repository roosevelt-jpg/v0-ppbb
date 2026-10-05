export type LocalizationCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type LocalizationCapability = {
  id: string;
  name: string;
  status: LocalizationCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 9 → VerbaLab Localization Platform (VL-141). */
export function localizationPlatformCatalog() {
  return {
    product: 'Enterprise Localization Platform',
    note:
      'Software-string localization over JSON/YAML + ICU + locale packs. Not a website/game/mobile TMS (Phrase/Lokalise competitor).',
    capabilities: [
      {
        id: 'software_strings',
        name: 'Software strings',
        status: 'shipped',
        api: 'POST /v1/localize',
        notes: 'Key-stable JSON/YAML MT with ICU passthrough.',
      },
      {
        id: 'pluralization',
        name: 'Pluralization',
        status: 'shipped',
        api: 'POST /v1/icu/validate|format',
        notes: 'ICU plural protect + validate/format (Intl.PluralRules).',
      },
      {
        id: 'gender_rules',
        name: 'Gender rules',
        status: 'shipped',
        api: 'POST /v1/icu/format',
        notes: 'ICU select arms + locale-pack honorific notes — not morphological gender inflection.',
      },
      {
        id: 'currency',
        name: 'Currency',
        status: 'shipped',
        api: 'POST /v1/locales/format',
        notes: 'Intl currency via locale pack currencyCode.',
      },
      {
        id: 'timezone',
        name: 'Timezone',
        status: 'shipped',
        api: 'POST /v1/locales/format',
        notes: 'IANA timeZone on Intl.DateTimeFormat.',
      },
      {
        id: 'date_formats',
        name: 'Date formats',
        status: 'shipped',
        api: 'POST /v1/locales/format',
        notes: 'Intl date/time formatting.',
      },
      {
        id: 'rtl_layout',
        name: 'RTL layout',
        status: 'shipped',
        api: 'GET /v1/locales/:code/layout',
        notes: 'dir/rtl/script metadata from language registry.',
      },
      {
        id: 'localization_qa',
        name: 'Localization QA',
        status: 'shipped',
        api: 'POST /v1/localize/qa',
        notes: 'Key parity, ICU, empty/identical checks — not screenshot QA.',
      },
      {
        id: 'applications',
        name: 'Applications',
        status: 'shipped',
        api: 'POST /v1/localize',
        notes: 'i18n JSON/YAML resource files e2e — not app-store packaging or binary catalogs.',
      },
      {
        id: 'documents',
        name: 'Documents',
        status: 'shipped',
        api: 'POST /v1/documents/translate',
        notes: 'Document jobs via Translation Engine (DOCX/PDF/TXT) — not a TMS document suite.',
      },
      {
        id: 'media',
        name: 'Media',
        status: 'shipped',
        api: 'POST /v1/translate/formats',
        notes: 'SRT subtitle MT e2e; broader speech/media APIs live under Speech/Voice — not a media localization OS.',
      },
      {
        id: 'websites',
        name: 'Websites',
        status: 'shipped',
        api: 'POST /v1/localize/surfaces/websites',
        notes: 'Website string-pack localization via surface=websites over JSON/YAML catalog path.',
      },
      {
        id: 'mobile_apps',
        name: 'Mobile apps',
        status: 'shipped',
        api: 'POST /v1/localize/surfaces/mobile_apps',
        notes: 'Mobile string catalog surface (Android/iOS resource JSON) — not Xcode project packaging.',
      },
      {
        id: 'desktop_apps',
        name: 'Desktop apps',
        status: 'shipped',
        api: 'POST /v1/localize/surfaces/desktop_apps',
        notes: 'Desktop resource string surface over JSON/YAML catalog path.',
      },
      {
        id: 'games',
        name: 'Games',
        status: 'shipped',
        api: 'POST /v1/localize/surfaces/games',
        notes: 'Game dialogue/string pack surface over JSON/YAML — not a game asset pipeline OS.',
      },
    ] satisfies LocalizationCapability[],
    engines: {
      localization: { status: 'shipped', api: 'POST /v1/localize' },
      icu: { status: 'shipped', api: '/v1/icu/*' },
      localePacks: { status: 'shipped', api: '/v1/locales' },
      qa: { status: 'shipped', api: 'POST /v1/localize/qa' },
      rest: { status: 'shipped' },
      graphql: { status: 'shipped', notes: 'localize + ICU ops' },
      sdk: { status: 'shipped', package: '@verbalab/sdk' },
      analytics: { status: 'shipped', api: 'GET /v1/analytics/overview', notes: 'Org translate analytics' },
      monitoring: { status: 'shipped', api: 'GET /v1/metrics/translate' },
    },
    links: {
      dashboard: '/localization',
      localize: '/localize',
      locales: '/locales',
      docs: '/docs/LOCALIZATION.md',
    },
  };
}
