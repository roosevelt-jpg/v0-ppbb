/**
 * Lexicon / accent / culture packs for strategic global underserved languages.
 * Merged into the African linguistic engine ACTIVE_PACKS surface.
 */
type LexEntry = {
  source: string;
  target: string;
  domain?: string;
  slang?: boolean;
  culturalNote?: string;
};

type AccentHint = {
  code: string;
  language: string;
  label: string;
  notes: string;
};

export const GLOBAL_LEX_PACKS: Record<string, LexEntry[]> = {
  'en-th': [
    { source: 'hello', target: 'sawasdee', domain: 'greetings' },
    { source: 'thank you', target: 'khob khun', domain: 'greetings' },
    { source: 'how are you?', target: 'sabaidee mai?', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'klinik yu tee nai?', domain: 'health' },
    { source: 'please wait here', target: 'prode wait tee nee', domain: 'public' },
    { source: 'i need help', target: 'chan tong kan chuay', domain: 'public' },
    { source: 'send money', target: 'song ngern', domain: 'banking' },
    { source: 'government services', target: 'borikan rat', domain: 'government' },
    { source: 'no worries', target: 'mai pen rai', domain: 'slang', slang: true, culturalNote: 'Soften refusals' },
  ],
  'en-vi': [
    { source: 'hello', target: 'xin chao', domain: 'greetings' },
    { source: 'thank you', target: 'cam on', domain: 'greetings' },
    { source: 'how are you?', target: 'ban khoe khong?', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'phong kham o dau?', domain: 'health' },
    { source: 'please wait here', target: 'vui long doi o day', domain: 'public' },
    { source: 'i need help', target: 'toi can giup do', domain: 'public' },
    { source: 'send money', target: 'chuyen tien', domain: 'banking' },
    { source: 'government services', target: 'dich vu cong', domain: 'government' },
  ],
  'en-tl': [
    { source: 'hello', target: 'kumusta', domain: 'greetings' },
    { source: 'thank you', target: 'salamat', domain: 'greetings' },
    { source: 'how are you?', target: 'kumusta ka?', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'nasaan ang klinika?', domain: 'health' },
    { source: 'please wait here', target: 'maghintay po dito', domain: 'public', culturalNote: 'po marks respect' },
    { source: 'i need help', target: 'kailangan ko ng tulong', domain: 'public' },
    { source: 'send money', target: 'magpadala ng pera', domain: 'banking' },
    { source: 'government services', target: 'mga serbisyong pampubliko', domain: 'government' },
  ],
  'en-ms': [
    { source: 'hello', target: 'halo', domain: 'greetings' },
    { source: 'thank you', target: 'terima kasih', domain: 'greetings' },
    { source: 'how are you?', target: 'apa khabar?', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'klinik di mana?', domain: 'health' },
    { source: 'please wait here', target: 'sila tunggu di sini', domain: 'public' },
    { source: 'i need help', target: 'saya perlukan bantuan', domain: 'public' },
    { source: 'send money', target: 'hantar wang', domain: 'banking' },
    { source: 'government services', target: 'perkhidmatan kerajaan', domain: 'government' },
  ],
  'en-hi': [
    { source: 'hello', target: 'namaste', domain: 'greetings' },
    { source: 'thank you', target: 'dhanyavaad', domain: 'greetings' },
    { source: 'how are you?', target: 'aap kaise hain?', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'clinic kahan hai?', domain: 'health' },
    { source: 'please wait here', target: 'kripya yahan prateeksha karein', domain: 'public' },
    { source: 'i need help', target: 'mujhe madad chahiye', domain: 'public' },
    { source: 'send money', target: 'paise bhejo', domain: 'banking' },
    { source: 'government services', target: 'sarkari sevaayein', domain: 'government' },
    { source: 'do the needful', target: 'avashyak karyavahi karein', domain: 'slang', slang: true },
  ],
  'en-ta': [
    { source: 'hello', target: 'vanakkam', domain: 'greetings' },
    { source: 'thank you', target: 'nandri', domain: 'greetings' },
    { source: 'how are you?', target: 'eppadi irukkireergal?', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'maruthuvamanai enga?', domain: 'health' },
    { source: 'please wait here', target: 'thayavu seithu ingu irungal', domain: 'public' },
    { source: 'i need help', target: 'enakku udhavi venum', domain: 'public' },
    { source: 'send money', target: 'panam anupungal', domain: 'banking' },
    { source: 'government services', target: 'arasu sevegal', domain: 'government' },
  ],
  'en-bn': [
    { source: 'hello', target: 'nomoshkar', domain: 'greetings' },
    { source: 'thank you', target: 'dhonnobad', domain: 'greetings' },
    { source: 'how are you?', target: 'apni kemon achen?', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'clinic kothay?', domain: 'health' },
    { source: 'please wait here', target: 'doya kore ekhane wait korun', domain: 'public' },
    { source: 'i need help', target: 'amar shahajjo dorkar', domain: 'public' },
    { source: 'send money', target: 'taka pathan', domain: 'banking' },
    { source: 'government services', target: 'sorkari sheba', domain: 'government' },
  ],
  'en-ht': [
    { source: 'hello', target: 'bonjou', domain: 'greetings' },
    { source: 'thank you', target: 'mesi', domain: 'greetings' },
    { source: 'how are you?', target: 'kijan ou ye?', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'kote klinik la ye?', domain: 'health' },
    { source: 'please wait here', target: 'tanpri tann isit la', domain: 'public' },
    { source: 'i need help', target: 'mwen bezwen ed', domain: 'public' },
    { source: 'send money', target: 'voye lajan', domain: 'banking' },
    { source: 'government services', target: 'sevès gouvènman', domain: 'government' },
  ],
  'en-qu': [
    { source: 'hello', target: 'allillanchu', domain: 'greetings' },
    { source: 'thank you', target: 'sulpayki', domain: 'greetings' },
    { source: 'how are you?', target: 'imaynalla kashanki?', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'maypitaq clinica?', domain: 'health' },
    { source: 'please wait here', target: 'ama hina kaypi suyay', domain: 'public' },
    { source: 'i need help', target: 'yanapayta necesitani', domain: 'public' },
    { source: 'send money', target: 'qullqita apachiy', domain: 'banking' },
    { source: 'government services', target: 'gobierno servicio', domain: 'government' },
  ],
  'en-jam': [
    { source: 'hello', target: 'wah gwaan', domain: 'greetings', slang: true },
    { source: 'thank you', target: 'big up', domain: 'greetings', slang: true },
    { source: 'how are you?', target: 'how yuh do?', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'weh di clinic deh?', domain: 'health' },
    { source: 'please wait here', target: 'hold on yah so', domain: 'public' },
    { source: 'i need help', target: 'mi need help', domain: 'public' },
    { source: 'no worries', target: 'irie', domain: 'slang', slang: true },
  ],
  'en-es': [
    { source: 'hello', target: 'hola', domain: 'greetings' },
    { source: 'thank you', target: 'gracias', domain: 'greetings' },
    { source: 'how are you?', target: 'como estas?', domain: 'greetings' },
    { source: 'where is the clinic?', target: 'donde esta la clinica?', domain: 'health' },
    { source: 'please wait here', target: 'por favor espere aqui', domain: 'public' },
    { source: 'i need help', target: 'necesito ayuda', domain: 'public' },
    { source: 'send money', target: 'enviar dinero', domain: 'banking' },
    { source: 'government services', target: 'servicios del gobierno', domain: 'government' },
  ],
};

export const GLOBAL_ACCENT_HINTS: AccentHint[] = [
  { code: 'th-TH', language: 'th', label: 'Central Thai', notes: 'krub/ka particles + soft refusal (mai pen rai)' },
  { code: 'vi-VN', language: 'vi', label: 'Vietnamese', notes: 'Tone-marked Vietnamese public phrasing' },
  { code: 'tl-PH', language: 'tl', label: 'Tagalog', notes: 'po/opo respect markers' },
  { code: 'hi-IN', language: 'hi', label: 'Indian Hindi', notes: 'Hinglish-aware formal Hindi' },
  { code: 'ta-IN', language: 'ta', label: 'Indian Tamil', notes: 'Respectful plural address' },
  { code: 'ht-HT', language: 'ht', label: 'Haitian Creole', notes: 'Kreyol everyday register vs French formal' },
  { code: 'qu-PE', language: 'qu', label: 'Peruvian Quechua', notes: 'Andean respectful address' },
  { code: 'es-MX', language: 'es', label: 'Mexican Spanish', notes: 'LatAm Spanish public services' },
  { code: 'pt-BR', language: 'pt', label: 'Brazilian Portuguese', notes: 'BR Portuguese (not PT-PT)' },
  { code: 'en-IN', language: 'en', label: 'Indian English', notes: 'Indian English lexical norms' },
  { code: 'en-JM', language: 'en', label: 'Jamaican English', notes: 'English-Patwa continuum awareness' },
  { code: 'yue-HK', language: 'yue', label: 'Hong Kong Cantonese', notes: 'Spoken Cantonese + Traditional Chinese UI' },
];

export const GLOBAL_BEHAVIOR_NOTES = [
  { id: 'sea-particles', note: 'SEA languages often encode politeness in particles (Thai krub/ka, Tagalog po) — preserve them in MT.' },
  { id: 'india-respect', note: 'South Asian formal address often uses plural/respect forms; avoid overly casual singular.' },
  { id: 'latam-voseo', note: 'Rioplatense and some LatAm varieties use voseo — do not force Mexican tu forms globally.' },
  { id: 'caribbean-continuum', note: 'Caribbean English creoles sit on a continuum with standard English — offer both registers in civic UX.' },
  { id: 'indigenous-names', note: 'Keep Quechua/Aymara/Nahuatl/Maya personal and place names stable across Spanish bridges.' },
];
