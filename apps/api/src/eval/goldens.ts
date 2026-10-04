/**
 * Hand-authored EN→African + strategic-global golden segments for VL-100.
 * Short everyday / public-sector phrases — not a licensed FLORES dump.
 * Expand with licensed datasets under VL-101.
 */
export type GoldenSegment = {
  id: string;
  source: string;
  reference: string;
  domain?: string;
};

export type GoldenPair = {
  sourceLang: string;
  targetLang: string;
  segments: GoldenSegment[];
};

export const GOLDEN_PAIRS: GoldenPair[] = [
  {
    sourceLang: 'en',
    targetLang: 'sw',
    segments: [
      { id: 'en-sw-01', source: 'Hello', reference: 'Habari', domain: 'greetings' },
      { id: 'en-sw-02', source: 'Thank you', reference: 'Asante', domain: 'greetings' },
      { id: 'en-sw-03', source: 'How are you?', reference: 'Habari yako?', domain: 'greetings' },
      { id: 'en-sw-04', source: 'Good morning', reference: 'Habari za asubuhi', domain: 'greetings' },
      { id: 'en-sw-05', source: 'Where is the clinic?', reference: 'Kliniki iko wapi?', domain: 'health' },
      { id: 'en-sw-06', source: 'Please wait here', reference: 'Tafadhali subiri hapa', domain: 'public' },
      { id: 'en-sw-07', source: 'I need help', reference: 'Nahitaji msaada', domain: 'public' },
      { id: 'en-sw-08', source: 'The office is closed', reference: 'Ofisi imefungwa', domain: 'public' },
      { id: 'en-sw-09', source: 'Bring your identity card', reference: 'Lete kitambulisho chako', domain: 'public' },
      { id: 'en-sw-10', source: 'Water is available', reference: 'Maji yanapatikana', domain: 'public' },
      { id: 'en-sw-11', source: 'School starts tomorrow', reference: 'Shule inaanza kesho', domain: 'education' },
      { id: 'en-sw-12', source: 'The meeting is at noon', reference: 'Mkutano ni saa sita mchana', domain: 'business' },
    ],
  },
  {
    sourceLang: 'en',
    targetLang: 'yo',
    segments: [
      { id: 'en-yo-01', source: 'Hello', reference: 'Báwo', domain: 'greetings' },
      { id: 'en-yo-02', source: 'Thank you', reference: 'E ṣé', domain: 'greetings' },
      { id: 'en-yo-03', source: 'How are you?', reference: 'Báwo ni?', domain: 'greetings' },
      { id: 'en-yo-04', source: 'Good morning', reference: 'Ẹ káàárọ̀', domain: 'greetings' },
      { id: 'en-yo-05', source: 'Where is the clinic?', reference: 'Ibi ìtọ́jú wà níbo?', domain: 'health' },
      { id: 'en-yo-06', source: 'Please wait here', reference: 'Jọ̀wọ́ dúró níbí', domain: 'public' },
      { id: 'en-yo-07', source: 'I need help', reference: 'Mo nílò ìrànlọ́wọ́', domain: 'public' },
      { id: 'en-yo-08', source: 'The office is closed', reference: 'Ọ́fíìsì ti padé', domain: 'public' },
      { id: 'en-yo-09', source: 'Bring your identity card', reference: 'Mú káàdì ìdánimọ̀ rẹ wá', domain: 'public' },
      { id: 'en-yo-10', source: 'Water is available', reference: 'Omi wà', domain: 'public' },
      { id: 'en-yo-11', source: 'School starts tomorrow', reference: 'Ilé-ìwé yóò bẹ̀rẹ̀ lọ́la', domain: 'education' },
      { id: 'en-yo-12', source: 'The meeting is at noon', reference: 'Ìpàdé wà ní ọ̀sán', domain: 'business' },
    ],
  },
  {
    sourceLang: 'en',
    targetLang: 'am',
    segments: [
      { id: 'en-am-01', source: 'Hello', reference: 'ሰላም', domain: 'greetings' },
      { id: 'en-am-02', source: 'Thank you', reference: 'አመሰግናለሁ', domain: 'greetings' },
      { id: 'en-am-03', source: 'How are you?', reference: 'እንደምን አደርክ?', domain: 'greetings' },
      { id: 'en-am-04', source: 'Good morning', reference: 'እንደምን አደሩ', domain: 'greetings' },
      { id: 'en-am-05', source: 'Where is the clinic?', reference: 'ክሊኒኩ የት ነው?', domain: 'health' },
      { id: 'en-am-06', source: 'Please wait here', reference: 'እባክዎ እዚህ ይጠብቁ', domain: 'public' },
      { id: 'en-am-07', source: 'I need help', reference: 'እርዳታ እፈልጋለሁ', domain: 'public' },
      { id: 'en-am-08', source: 'The office is closed', reference: 'ቢሮው ተዘግቷል', domain: 'public' },
      { id: 'en-am-09', source: 'Bring your identity card', reference: 'መታወቂያዎን ያምጡ', domain: 'public' },
      { id: 'en-am-10', source: 'Water is available', reference: 'ውሃ አለ', domain: 'public' },
      { id: 'en-am-11', source: 'School starts tomorrow', reference: 'ትምህርት ቤት ነገ ይጀምራል', domain: 'education' },
      { id: 'en-am-12', source: 'The meeting is at noon', reference: 'ስብሰባው እኩለ ቀን ነው', domain: 'business' },
    ],
  },
  {
    sourceLang: 'en',
    targetLang: 'th',
    segments: [
      { id: 'en-th-01', source: 'Hello', reference: 'sawasdee', domain: 'greetings' },
      { id: 'en-th-02', source: 'Thank you', reference: 'khob khun', domain: 'greetings' },
      { id: 'en-th-03', source: 'How are you?', reference: 'sabaidee mai?', domain: 'greetings' },
      { id: 'en-th-04', source: 'Where is the clinic?', reference: 'klinik yu tee nai?', domain: 'health' },
      { id: 'en-th-05', source: 'Please wait here', reference: 'prode wait tee nee', domain: 'public' },
      { id: 'en-th-06', source: 'I need help', reference: 'chan tong kan chuay', domain: 'public' },
    ],
  },
  {
    sourceLang: 'en',
    targetLang: 'vi',
    segments: [
      { id: 'en-vi-01', source: 'Hello', reference: 'xin chao', domain: 'greetings' },
      { id: 'en-vi-02', source: 'Thank you', reference: 'cam on', domain: 'greetings' },
      { id: 'en-vi-03', source: 'How are you?', reference: 'ban khoe khong?', domain: 'greetings' },
      { id: 'en-vi-04', source: 'Where is the clinic?', reference: 'phong kham o dau?', domain: 'health' },
      { id: 'en-vi-05', source: 'Please wait here', reference: 'vui long doi o day', domain: 'public' },
      { id: 'en-vi-06', source: 'I need help', reference: 'toi can giup do', domain: 'public' },
    ],
  },
  {
    sourceLang: 'en',
    targetLang: 'ht',
    segments: [
      { id: 'en-ht-01', source: 'Hello', reference: 'bonjou', domain: 'greetings' },
      { id: 'en-ht-02', source: 'Thank you', reference: 'mesi', domain: 'greetings' },
      { id: 'en-ht-03', source: 'How are you?', reference: 'kijan ou ye?', domain: 'greetings' },
      { id: 'en-ht-04', source: 'Where is the clinic?', reference: 'kote klinik la ye?', domain: 'health' },
      { id: 'en-ht-05', source: 'Please wait here', reference: 'tanpri tann isit la', domain: 'public' },
      { id: 'en-ht-06', source: 'I need help', reference: 'mwen bezwen ed', domain: 'public' },
    ],
  },
  {
    sourceLang: 'en',
    targetLang: 'qu',
    segments: [
      { id: 'en-qu-01', source: 'Hello', reference: 'allillanchu', domain: 'greetings' },
      { id: 'en-qu-02', source: 'Thank you', reference: 'sulpayki', domain: 'greetings' },
      { id: 'en-qu-03', source: 'How are you?', reference: 'imaynalla kashanki?', domain: 'greetings' },
      { id: 'en-qu-04', source: 'Where is the clinic?', reference: 'maypitaq clinica?', domain: 'health' },
      { id: 'en-qu-05', source: 'Please wait here', reference: 'ama hina kaypi suyay', domain: 'public' },
      { id: 'en-qu-06', source: 'I need help', reference: 'yanapayta necesitani', domain: 'public' },
    ],
  },
  {
    sourceLang: 'en',
    targetLang: 'hi',
    segments: [
      { id: 'en-hi-01', source: 'Hello', reference: 'namaste', domain: 'greetings' },
      { id: 'en-hi-02', source: 'Thank you', reference: 'dhanyavaad', domain: 'greetings' },
      { id: 'en-hi-03', source: 'How are you?', reference: 'aap kaise hain?', domain: 'greetings' },
      { id: 'en-hi-04', source: 'Where is the clinic?', reference: 'clinic kahan hai?', domain: 'health' },
      { id: 'en-hi-05', source: 'Please wait here', reference: 'kripya yahan prateeksha karein', domain: 'public' },
      { id: 'en-hi-06', source: 'I need help', reference: 'mujhe madad chahiye', domain: 'public' },
    ],
  },
];

export function pairKey(sourceLang: string, targetLang: string) {
  return `${sourceLang}-${targetLang}`;
}
