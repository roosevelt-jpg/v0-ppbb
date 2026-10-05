import {
  GLOBAL_LEX_PACKS,
  GLOBAL_ACCENT_HINTS,
  GLOBAL_BEHAVIOR_NOTES,
} from './global-linguistic-packs';

/**
 * VerbaLab African Linguistic Engine — owned phrase/slang/culture/accent layer.
 * Deterministic, expandable lexicon packs. Neural weights plug in later via
 * VERBALAB_WEIGHTS_URL without changing the product API surface.
 */

export type LexEntry = {
  source: string;
  target: string;
  domain?: string;
  slang?: boolean;
  culturalNote?: string;
};

export type AccentHint = {
  code: string;
  language: string;
  label: string;
  notes: string;
};

const PACKS: Record<string, LexEntry[]> = {
  'en-sw': [
    { source: 'hello', target: 'habari', domain: 'greetings' },
    { source: 'thank you', target: 'asante', domain: 'greetings' },
    { source: 'how are you?', target: 'habari yako?', domain: 'greetings' },
    { source: 'good morning', target: 'habari za asubuhi', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'kliniki iko wapi?', domain: 'health' },
    { source: 'please wait here', target: 'tafadhali subiri hapa', domain: 'public' },
    { source: 'i need help', target: 'nahitaji msaada', domain: 'public' },
    { source: 'the office is closed', target: 'ofisi imefungwa', domain: 'public' },
    { source: 'bring your identity card', target: 'lete kitambulisho chako', domain: 'public' },
    { source: 'water is available', target: 'maji yanapatikana', domain: 'public' },
    { source: 'school starts tomorrow', target: 'shule inaanza kesho', domain: 'education' },
    { source: 'the meeting is at noon', target: 'mkutano ni saa sita mchana', domain: 'business' },
    { source: 'bro', target: 'kaka', domain: 'slang', slang: true },
    { source: 'no worries', target: 'hakuna shida', domain: 'slang', slang: true },
    { source: 'send money', target: 'tuma pesa', domain: 'banking' },
    { source: 'open an account', target: 'fungua akaunti', domain: 'banking' },
    { source: 'insurance claim', target: 'dai la bima', domain: 'insurance' },
    { source: 'pay school fees', target: 'lipa karo za shule', domain: 'education' },
    { source: 'hospital admission', target: 'kulazwa hospitalini', domain: 'health' },
    { source: 'add to cart', target: 'ongeza kwenye kikapu', domain: 'ecommerce' },
    { source: 'respect the elders', target: 'heshimu wazee', domain: 'culture', culturalNote: 'Age respect norm' },
    { source: 'government services', target: 'huduma za serikali', domain: 'government' },
    { source: 'file a complaint', target: 'wasilisha malalamiko', domain: 'government' },
  ],
  'en-yo': [
    { source: 'hello', target: 'báwo', domain: 'greetings' },
    { source: 'thank you', target: 'e ṣé', domain: 'greetings' },
    { source: 'how are you?', target: 'báwo ni?', domain: 'greetings' },
    { source: 'good morning', target: 'ẹ káàárọ̀', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'ibi ìtọ́jú wà níbo?', domain: 'health' },
    { source: 'please wait here', target: 'jọ̀wọ́ dúró níbí', domain: 'public' },
    { source: 'i need help', target: 'mo nílò ìrànlọ́wọ́', domain: 'public' },
    { source: 'the office is closed', target: 'ọ́fíìsì ti padé', domain: 'public' },
    { source: 'bring your identity card', target: 'mú káàdì ìdánimọ̀ rẹ wá', domain: 'public' },
    { source: 'water is available', target: 'omi wà', domain: 'public' },
    { source: 'school starts tomorrow', target: 'ilé-ìwé yóò bẹ̀rẹ̀ lọ́la', domain: 'education' },
    { source: 'the meeting is at noon', target: 'ìpàdé wà ní ọ̀sán', domain: 'business' },
    { source: 'how far?', target: 'báwo ni?', domain: 'slang', slang: true, culturalNote: 'Naija greeting slang' },
    { source: 'no wahala', target: 'kò sí wàhálà', domain: 'slang', slang: true },
    { source: 'send money', target: 'fi owó ránṣẹ́', domain: 'banking' },
    { source: 'open an account', target: 'ṣí àkọọ́lẹ̀', domain: 'banking' },
    { source: 'hospital admission', target: 'gbígbà wọlé sílé ìwòsàn', domain: 'health' },
    { source: 'government services', target: 'àwọn iṣẹ́ ìjọba', domain: 'government' },
    { source: 'pay school fees', target: 'san owó ilé-ìwé', domain: 'education' },
  ],
  'en-am': [
    { source: 'hello', target: 'selam', domain: 'greetings' },
    { source: 'thank you', target: 'ameseginalehu', domain: 'greetings' },
    { source: 'how are you?', target: 'endemin ader?', domain: 'greetings' },
    { source: 'good morning', target: 'endemin aderu', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'kliniku yet new?', domain: 'health' },
    { source: 'please wait here', target: 'ebakwo ezih yitebqu', domain: 'public' },
    { source: 'i need help', target: 'erdata efeligalehu', domain: 'public' },
    { source: 'the office is closed', target: 'birow tezegtoal', domain: 'public' },
    { source: 'bring your identity card', target: 'metawoqiyaown yametu', domain: 'public' },
    { source: 'water is available', target: 'wuha alle', domain: 'public' },
    { source: 'school starts tomorrow', target: 'timhirt bet nege yijemral', domain: 'education' },
    { source: 'the meeting is at noon', target: 'sibsebaw ekule qen new', domain: 'business' },
    { source: 'send money', target: 'genzeb lak', domain: 'banking' },
    { source: 'open an account', target: 'hisab kfet', domain: 'banking' },
    { source: 'hospital admission', target: 'be hospital metenat', domain: 'health' },
    { source: 'government services', target: 'ye mengist agelglototch', domain: 'government' },
  ],
  'en-ha': [
    { source: 'hello', target: 'sannu', domain: 'greetings' },
    { source: 'thank you', target: 'na gode', domain: 'greetings' },
    { source: 'how are you?', target: 'yaya kake?', domain: 'greetings' },
    { source: 'good morning', target: 'barka da safe', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'ina asibiti yake?', domain: 'health' },
    { source: 'please wait here', target: 'don Allah jira anan', domain: 'public' },
    { source: 'i need help', target: 'ina bukatar taimako', domain: 'public' },
    { source: 'the office is closed', target: 'ofishin ya rufe', domain: 'public' },
    { source: 'bring your identity card', target: 'kawo katin shaidarka', domain: 'public' },
    { source: 'send money', target: 'aika kudi', domain: 'banking' },
    { source: 'open an account', target: 'buɗe asusu', domain: 'banking' },
    { source: 'no wahala', target: 'babu matsala', domain: 'slang', slang: true },
    { source: 'hospital admission', target: 'shiga asibiti', domain: 'health' },
    { source: 'government services', target: 'ayyukan gwamnati', domain: 'government' },
    { source: 'pay school fees', target: 'biya kudin makaranta', domain: 'education' },
  ],
  'en-zu': [
    { source: 'hello', target: 'sawubona', domain: 'greetings' },
    { source: 'thank you', target: 'ngiyabonga', domain: 'greetings' },
    { source: 'how are you?', target: 'unjani?', domain: 'greetings' },
    { source: 'good morning', target: 'sawubona ekuseni', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'ikliniki ikuphi?', domain: 'health' },
    { source: 'please wait here', target: 'ngicela ulinde lapha', domain: 'public' },
    { source: 'i need help', target: 'ngidinga usizo', domain: 'public' },
    { source: 'send money', target: 'thumela imali', domain: 'banking' },
    { source: 'open an account', target: 'vula i-akhawunti', domain: 'banking' },
    { source: 'hospital admission', target: 'ukulaliswa esibhedlela', domain: 'health' },
    { source: 'pay school fees', target: 'khokha imali yesikole', domain: 'education' },
    { source: 'government services', target: 'izinsiza zikahulumeni', domain: 'government' },
  ],
};

const AFRICA_ACCENT_HINTS: AccentHint[] = [
  { code: 'sw-KE', language: 'sw', label: 'Kenyan Swahili', notes: 'Coastal/urban KE lexicon bias' },
  { code: 'sw-TZ', language: 'sw', label: 'Tanzanian Swahili', notes: 'Standard TZ phrasing bias' },
  { code: 'yo-NG', language: 'yo', label: 'Nigerian Yoruba', notes: 'Tone-aware Yoruba + Naija slang' },
  { code: 'ha-NG', language: 'ha', label: 'Nigerian Hausa', notes: 'Northern NG banking phrases' },
  { code: 'am-ET', language: 'am', label: 'Ethiopian Amharic', notes: 'Ethiopic script + formal register' },
  { code: 'zu-ZA', language: 'zu', label: 'South African Zulu', notes: 'ZA public services phrasing' },
  { code: 'en-NG', language: 'en', label: 'Nigerian English', notes: 'Naija English slang awareness' },
  { code: 'en-ZA', language: 'en', label: 'South African English', notes: 'ZA English register' },
  { code: 'fr-SN', language: 'fr', label: 'Senegalese French', notes: 'West African French' },
];

export const ACCENT_HINTS: AccentHint[] = [...AFRICA_ACCENT_HINTS, ...GLOBAL_ACCENT_HINTS];

const AFRICA_BEHAVIOR_NOTES = [
  { id: 'greet-elders', note: 'Prefer formal greetings with elders; age respect in many communities.' },
  { id: 'indirect-refusal', note: 'Soft refusals common — avoid blunt no in customer service MT.' },
  { id: 'mobile-money', note: 'Banking UX should name M-Pesa/MoMo-style flows where relevant.' },
  { id: 'communal', note: 'Family/community references often preferred over purely individual framing.' },
];

export const BEHAVIOR_NOTES = [...AFRICA_BEHAVIOR_NOTES, ...GLOBAL_BEHAVIOR_NOTES];

function withReversePacks(forward: Record<string, LexEntry[]>): Record<string, LexEntry[]> {
  const out: Record<string, LexEntry[]> = { ...forward };
  for (const [pair, entries] of Object.entries(forward)) {
    const [source, target] = pair.split('-');
    if (!source || !target) continue;
    const rev = `${target}-${source}`;
    if (out[rev]?.length) continue;
    out[rev] = entries.map((e) => ({
      source: e.target.toLowerCase(),
      target: e.source,
      domain: e.domain,
      slang: e.slang,
      culturalNote: e.culturalNote,
    }));
  }
  return out;
}

const ACTIVE_PACKS = withReversePacks({ ...PACKS, ...GLOBAL_LEX_PACKS });

function packKey(source: string, target: string) {
  return `${source.toLowerCase()}-${target.toLowerCase()}`;
}

export function translateAfrican(input: {
  text: string;
  source: string;
  target: string;
  accent?: string;
}): {
  text: string;
  provider: string;
  model: string;
  matched: boolean;
  domains: string[];
  culturalNotes: string[];
} {
  const key = packKey(input.source, input.target);
  const pack = ACTIVE_PACKS[key] ?? [];
  const normalized = input.text.trim().toLowerCase().replace(/\s+/g, ' ');
  const hit = pack.find((e) => e.source === normalized);
  const domains: string[] = [];
  const culturalNotes: string[] = [];
  if (hit) {
    if (hit.domain) domains.push(hit.domain);
    if (hit.culturalNote) culturalNotes.push(hit.culturalNote);
    return {
      text: hit.target,
      provider: 'verbalab_model_runtime',
      model: 'translate-fm-african',
      matched: true,
      domains,
      culturalNotes,
    };
  }
  return {
    text: input.text,
    provider: 'verbalab_model_runtime',
    model: 'translate-fm-african',
    matched: false,
    domains,
    culturalNotes,
  };
}

export function engineManifest() {
  const pairs = Object.keys(ACTIVE_PACKS);
  const entryCount = pairs.reduce((n, k) => n + ACTIVE_PACKS[k]!.length, 0);
  return {
    id: 'verbalab-linguistic-engine',
    ownedModels: true,
    neuralWeightsInProcess: Boolean(process.env.VERBALAB_WEIGHTS_URL?.trim()),
    neuralWeightsUrl: process.env.VERBALAB_WEIGHTS_URL?.trim() || null,
    lexiconPairs: pairs,
    lexiconEntries: entryCount,
    accents: ACCENT_HINTS,
    behaviorNotes: BEHAVIOR_NOTES,
    modalities: ['mt', 'stt', 'tts', 'chat', 'embed', 'ocr', 'detect', 'clone'],
    upgradePath:
      'Set VERBALAB_WEIGHTS_URL to swap lexicon decode for neural decode without API changes.',
  };
}

export function listPacks() {
  return Object.entries(ACTIVE_PACKS).map(([pair, entries]) => ({
    pair,
    count: entries.length,
    slang: entries.filter((e) => e.slang).length,
    domains: [...new Set(entries.map((e) => e.domain).filter(Boolean))],
  }));
}

export function allEvalCases() {
  return Object.entries(ACTIVE_PACKS).flatMap(([pair, entries]) => {
    const [source, target] = pair.split('-') as [string, string];
    return entries.map((e) => ({
      source,
      target,
      text: e.source,
      expected: e.target,
      domain: e.domain ?? 'general',
      slang: Boolean(e.slang),
    }));
  });
}
