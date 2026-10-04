
export type ConsentStatus = 'unverified' | 'attested' | 'restricted';

export type CulturalEntryKind =
  | 'greeting'
  | 'etiquette'
  | 'festival'
  | 'proverb'
  | 'idiom'
  | 'naming'
  | 'oral_history';

export type CulturalEntry = {
  id: string;
  kind: CulturalEntryKind;
  title: string;
  summary: string;
  languageCodes: string[];
  regions: string[];
  provenance: string;
  sourceCommunity: string;
  consentStatus: ConsentStatus;
};

/**
 * Library Phase 129 → Cultural Intelligence (VL-262).
 * Traditional knowledge requires provenance/sourceCommunity/consentStatus.
 * traditionalKnowledgeConsentRequired=true — not an extractive scrape.
 */
export function culturalIntelligenceSeed(): CulturalEntry[] {
  return [
    {
      id: 'greet-sw-habari',
      kind: 'greeting',
      title: 'Habari / Hujambo greeting pattern',
      summary: 'Common Swahili greeting exchange patterns used across East Africa.',
      languageCodes: ['sw'],
      regions: ['East Africa'],
      provenance: 'Public descriptive linguistics summary — community attestation pending',
      sourceCommunity: 'Swahili-speaking communities (East Africa)',
      consentStatus: 'unverified',
    },
    {
      id: 'etiquette-yo-respect',
      kind: 'etiquette',
      title: 'Yoruba age-respect greeting posture',
      summary: 'Age-graded greeting expectations in many Yoruba communities.',
      languageCodes: ['yo'],
      regions: ['West Africa'],
      provenance: 'Secondary ethnographic summaries — requires community review',
      sourceCommunity: 'Yoruba communities (Nigeria / diaspora)',
      consentStatus: 'unverified',
    },
    {
      id: 'festival-am-timket',
      kind: 'festival',
      title: 'Timket (Epiphany) public festival overview',
      summary: 'High-level public description of Timket celebrations in Ethiopia.',
      languageCodes: ['am'],
      regions: ['Horn of Africa'],
      provenance: 'Public cultural calendar descriptions',
      sourceCommunity: 'Ethiopian Orthodox communities',
      consentStatus: 'attested',
    },
    {
      id: 'proverb-ha-seed',
      kind: 'proverb',
      title: 'Hausa proverb seed (placeholder)',
      summary: 'Catalog slot for attested Hausa proverbs — content gated on consent.',
      languageCodes: ['ha'],
      regions: ['West Africa', 'Sahel'],
      provenance: 'Restricted until source-community attestation',
      sourceCommunity: 'Hausa communities',
      consentStatus: 'restricted',
    },
    {
      id: 'idiom-zu-seed',
      kind: 'idiom',
      title: 'Zulu idiom seed (placeholder)',
      summary: 'Catalog slot for attested Zulu idioms — content gated on consent.',
      languageCodes: ['zu'],
      regions: ['Southern Africa'],
      provenance: 'Restricted until source-community attestation',
      sourceCommunity: 'Zulu communities',
      consentStatus: 'restricted',
    },
    {
      id: 'naming-ig-seed',
      kind: 'naming',
      title: 'Igbo naming practice overview',
      summary: 'High-level public overview of meaning-bearing Igbo personal names.',
      languageCodes: ['ig'],
      regions: ['West Africa'],
      provenance: 'Public onomastics summaries — community attestation pending',
      sourceCommunity: 'Igbo communities',
      consentStatus: 'unverified',
    },
    {
      id: 'oral-so-seed',
      kind: 'oral_history',
      title: 'Somali oral poetry tradition overview',
      summary: 'Public overview of Somali oral poetry as cultural practice — not a corpus dump.',
      languageCodes: ['so'],
      regions: ['Horn of Africa'],
      provenance: 'Public literary histories — traditional texts not scraped',
      sourceCommunity: 'Somali communities',
      consentStatus: 'unverified',
    },
    {
      id: 'greet-th-wai',
      kind: 'greeting',
      title: 'Thai wai + sawasdee greeting',
      summary: 'Wai gesture and sawasdee exchange with krub/ka particles mark respect in Thai public life.',
      languageCodes: ['th'],
      regions: ['Southeast Asia'],
      provenance: 'Public descriptive cultural summary — community attestation pending',
      sourceCommunity: 'Thai-speaking communities',
      consentStatus: 'unverified',
    },
    {
      id: 'etiquette-tl-po',
      kind: 'etiquette',
      title: 'Tagalog po/opo respect markers',
      summary: 'Po and opo encode respect toward elders and officials in Tagalog and Philippine English.',
      languageCodes: ['tl', 'en'],
      regions: ['Southeast Asia'],
      provenance: 'Public descriptive linguistics summary — community attestation pending',
      sourceCommunity: 'Filipino communities',
      consentStatus: 'unverified',
    },
    {
      id: 'greeting-hi-namaste',
      kind: 'greeting',
      title: 'Namaste / namaskar greeting pattern',
      summary: 'Common respectful South Asian greeting forms across Hindi and neighboring languages.',
      languageCodes: ['hi', 'ne', 'bn'],
      regions: ['South Asia'],
      provenance: 'Public cultural summaries — community attestation pending',
      sourceCommunity: 'Hindi and North Indian communities',
      consentStatus: 'unverified',
    },
    {
      id: 'festival-in-diwali',
      kind: 'festival',
      title: 'Diwali public festival overview',
      summary: 'High-level public description of Diwali celebrations across India and the diaspora.',
      languageCodes: ['hi', 'ta', 'bn', 'en'],
      regions: ['South Asia'],
      provenance: 'Public cultural calendar descriptions',
      sourceCommunity: 'Indian communities (multi-faith public observance)',
      consentStatus: 'attested',
    },
    {
      id: 'etiquette-qu-respect',
      kind: 'etiquette',
      title: 'Andean Quechua respectful address',
      summary: 'Respectful address and communal framing in Quechua-speaking Andean communities.',
      languageCodes: ['qu', 'ay'],
      regions: ['Latin America'],
      provenance: 'Secondary ethnographic summaries — requires community review',
      sourceCommunity: 'Quechua and Aymara communities (Andes)',
      consentStatus: 'unverified',
    },
    {
      id: 'greeting-ht-bonjou',
      kind: 'greeting',
      title: 'Haitian Creole bonjou exchange',
      summary: 'Everyday Kreyol greeting patterns; French remains in formal legal registers.',
      languageCodes: ['ht', 'fr'],
      regions: ['Caribbean'],
      provenance: 'Public descriptive linguistics summary — community attestation pending',
      sourceCommunity: 'Haitian communities',
      consentStatus: 'unverified',
    },
    {
      id: 'idiom-jam-irie',
      kind: 'idiom',
      title: 'Jamaican Patwa irie / wah gwaan',
      summary: 'Catalog slot for attested Patwa greeting idioms — register differs from Jamaican English.',
      languageCodes: ['jam', 'en'],
      regions: ['Caribbean'],
      provenance: 'Public descriptive summaries — community attestation pending',
      sourceCommunity: 'Jamaican communities',
      consentStatus: 'unverified',
    },
    {
      id: 'naming-mx-nahuatl',
      kind: 'naming',
      title: 'Nahuatl place and personal names',
      summary: 'Keep Nahuatl-origin place and personal names stable across Spanish bridges.',
      languageCodes: ['nhe', 'es'],
      regions: ['Latin America'],
      provenance: 'Public onomastics summaries — community attestation pending',
      sourceCommunity: 'Nahuatl-speaking communities (Mexico)',
      consentStatus: 'unverified',
    },
    {
      id: 'proverb-vi-seed',
      kind: 'proverb',
      title: 'Vietnamese proverb seed (placeholder)',
      summary: 'Catalog slot for attested Vietnamese proverbs — content gated on consent.',
      languageCodes: ['vi'],
      regions: ['Southeast Asia'],
      provenance: 'Restricted until source-community attestation',
      sourceCommunity: 'Vietnamese communities',
      consentStatus: 'restricted',
    },
    {
      id: 'oral-gn-seed',
      kind: 'oral_history',
      title: 'Guarani oral tradition overview',
      summary: 'Public overview of Guarani as a living co-official language and oral culture in Paraguay.',
      languageCodes: ['gn', 'es'],
      regions: ['Latin America'],
      provenance: 'Public literary histories — traditional texts not scraped',
      sourceCommunity: 'Guarani communities (Paraguay)',
      consentStatus: 'unverified',
    },

  ];
}

export function culturalIntelligenceEngineCatalog() {
  const entries = culturalIntelligenceSeed();
  return {
    product: 'VerbaLab Cultural Intelligence',
    note:
      'Cultural Intelligence. Greetings/etiquette/festivals/proverbs/idioms with provenance, sourceCommunity, and consentStatus. traditionalKnowledgeConsentRequired=true — not an extractive scrape of traditional knowledge.',
    capabilities: [
      {
        id: 'cultural-entries',
        name: 'Cultural Entries',
        status: 'shipped',
        api: 'GET /v1/cultural-intelligence/entries',
        notes: 'Seed entries with consent/provenance fields required.',
      },
      {
        id: 'consent-filter',
        name: 'Consent Filter',
        status: 'shipped',
        api: 'GET /v1/cultural-intelligence/entries?consentStatus=attested',
        notes: 'Filter by unverified|attested|restricted.',
      },
      {
        id: 'traditional-knowledge-guard',
        name: 'Traditional Knowledge Guard',
        status: 'shipped',
        api: 'GET /v1/cultural-intelligence/engine',
        notes: 'Engine honesty blocks extractive scrape claims.',
      },
    ],
    entries,
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      regeneratesVolumes1to11: false,
      traditionalKnowledgeConsentRequired: true,
      extractiveTraditionalKnowledgeScrape: false,
    },
    honesty: {
      traditionalKnowledgeConsentRequired: true,
      extractiveTraditionalKnowledgeScrape: false,
      provenanceRequired: true,
      sourceCommunityRequired: true,
      consentStatusRequired: true,
      coverageComplete: false,
      regeneratesVolumes1to11: false,
    },
    safety: {
      traditionalKnowledgeConsentRequired: true,
      extractiveTraditionalKnowledgeScrape: false,
      note:
        'Do not ingest traditional knowledge without attribution and consent. Restricted entries expose metadata only until attested.',
    },
    docs: '/docs/CULTURAL_INTELLIGENCE.md',
  };
}
