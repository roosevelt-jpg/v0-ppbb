/** Normalized plotters on the Africa watermark SVG (viewBox 0 0 200 240). */

export type AfricaPlotter = {
  code: string;
  name: string;
  x: number;
  y: number;
  languages: string[];
  /** Short note shown in the illustrative legend / hover title */
  sharing: string;
};

export const AFRICA_PLOTTERS: AfricaPlotter[] = [
  {
    code: 'MA',
    name: 'Morocco',
    x: 62,
    y: 28,
    languages: ['ar', 'ber', 'fr'],
    sharing: 'Maghreb speech + residency pin',
  },
  {
    code: 'EG',
    name: 'Egypt',
    x: 118,
    y: 42,
    languages: ['ar'],
    sharing: 'Arabic STT/TTS corridor',
  },
  {
    code: 'SN',
    name: 'Senegal',
    x: 38,
    y: 72,
    languages: ['wo', 'fr', 'ff'],
    sharing: 'West African voice packs',
  },
  {
    code: 'GH',
    name: 'Ghana',
    x: 52,
    y: 98,
    languages: ['en', 'ak', 'ee'],
    sharing: 'Akan/Twi + English bridge',
  },
  {
    code: 'NG',
    name: 'Nigeria',
    x: 72,
    y: 102,
    languages: ['en', 'yo', 'ha', 'ig'],
    sharing: 'Federation multilingual graph',
  },
  {
    code: 'ET',
    name: 'Ethiopia',
    x: 138,
    y: 98,
    languages: ['am', 'om'],
    sharing: 'Horn language sovereignty',
  },
  {
    code: 'KE',
    name: 'Kenya',
    x: 132,
    y: 122,
    languages: ['sw', 'en'],
    sharing: 'Swahili bilingual agents',
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    x: 128,
    y: 138,
    languages: ['sw'],
    sharing: 'Coastal Swahili norms',
  },
  {
    code: 'CD',
    name: 'DR Congo',
    x: 102,
    y: 128,
    languages: ['fr', 'sw', 'ln'],
    sharing: 'Central Africa data region',
  },
  {
    code: 'ZA',
    name: 'South Africa',
    x: 108,
    y: 198,
    languages: ['en', 'zu', 'xh', 'af'],
    sharing: 'Southern multilingual TTS',
  },
  {
    code: 'RW',
    name: 'Rwanda',
    x: 118,
    y: 132,
    languages: ['rw', 'en', 'fr'],
    sharing: 'Public-sector voice routes',
  },
  {
    code: 'CI',
    name: 'Côte d’Ivoire',
    x: 48,
    y: 108,
    languages: ['fr'],
    sharing: 'Francophone creative media',
  },
];

/** Soft arcs between hubs — illustrative language/data sharing, not real network edges. */
export const AFRICA_SHARING_ARCS: Array<[string, string]> = [
  ['NG', 'GH'],
  ['NG', 'KE'],
  ['KE', 'TZ'],
  ['KE', 'ET'],
  ['MA', 'EG'],
  ['SN', 'GH'],
  ['ZA', 'KE'],
  ['NG', 'ZA'],
];
