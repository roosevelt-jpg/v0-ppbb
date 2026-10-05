export type FamilySeed = {
  code: string;
  nameEn: string;
  parentCode?: string;
  notes?: string;
};

/** Curated families covering VerbaLab registry languages (VL-139). */
export const FAMILY_SEEDS: FamilySeed[] = [
  {
    code: 'indo_european',
    nameEn: 'Indo-European',
    notes: 'Includes Germanic and Romance languages in the vendor set.',
  },
  {
    code: 'afro_asiatic',
    nameEn: 'Afro-Asiatic',
    notes: 'Arabic, Amharic, Hausa, Somali and related.',
  },
  {
    code: 'niger_congo',
    nameEn: 'Niger–Congo',
    notes: 'Largest African family; Bantu and West African registry languages.',
  },
  {
    code: 'sino_tibetan',
    nameEn: 'Sino-Tibetan',
    notes: 'Vendor Chinese coverage.',
  },
  {
    code: 'japonic',
    nameEn: 'Japonic',
  },
  {
    code: 'koreanic',
    nameEn: 'Koreanic',
  },
  {
    code: 'turkic',
    nameEn: 'Turkic',
  },
  {
    code: 'austronesian',
    nameEn: 'Austronesian',
  },
  {
    code: 'nilo_saharan',
    nameEn: 'Nilo-Saharan',
    notes: 'Luo, Kanuri and related East/Central African registry languages.',
  },
  {
    code: 'khoisan',
    nameEn: 'Khoisan',
    notes: 'Click-language cluster representatives (e.g. Nama); not an exhaustive genetic claim.',
  },
  {
    code: 'dravidian',
    nameEn: 'Dravidian',
    notes: 'Tamil, Telugu, Kannada, Malayalam and related South Asian languages.',
  },
  {
    code: 'austroasiatic',
    nameEn: 'Austroasiatic',
    notes: 'Vietnamese, Khmer and related Mainland Southeast Asian languages.',
  },
  {
    code: 'tai_kadai',
    nameEn: 'Tai–Kadai',
    notes: 'Thai, Lao and related languages.',
  },
  {
    code: 'tupian',
    nameEn: 'Tupian',
    notes: 'Guaraní and related South American languages.',
  },
  {
    code: 'aymaran',
    nameEn: 'Aymaran',
    notes: 'Aymara and related Andean languages.',
  },
  {
    code: 'quechuan',
    nameEn: 'Quechuan',
    notes: 'Quechua varieties across the Andes.',
  },
  {
    code: 'uto_aztecan',
    nameEn: 'Uto-Aztecan',
    notes: 'Nahuatl and related Mesoamerican languages.',
  },
  {
    code: 'mayan',
    nameEn: 'Mayan',
    notes: 'Yucatec Maya and related Mesoamerican languages.',
  },
  {
    code: 'creole',
    nameEn: 'Creole / Contact',
    notes: 'Atlantic and Indian Ocean creoles; contact varieties catalogued for voice coverage.',
  },
];
