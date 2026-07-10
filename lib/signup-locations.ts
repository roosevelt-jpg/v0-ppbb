/** UAE emirates and common city/area options for dependent dropdowns. */
export const UAE_EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Fujairah',
  'Ras Al Khaimah',
  'Umm Al Quwain',
] as const

export type UaeEmirate = (typeof UAE_EMIRATES)[number]

export const UAE_CITIES_BY_EMIRATE: Record<UaeEmirate, string[]> = {
  'Abu Dhabi': ['Abu Dhabi City', 'Al Ain', 'Madinat Zayed', 'Other'],
  Dubai: ['Dubai', 'Deira', 'Bur Dubai', 'Jumeirah', 'Dubai Marina', 'JLT', 'Other'],
  Sharjah: ['Sharjah City', 'Khor Fakkan', 'Kalba', 'Other'],
  Ajman: ['Ajman City', 'Other'],
  Fujairah: ['Fujairah City', 'Dibba', 'Other'],
  'Ras Al Khaimah': ['RAK City', 'Al Hamra', 'Other'],
  'Umm Al Quwain': ['UAQ City', 'Other'],
}

export function isUaeCountry(country: string): boolean {
  const normalized = country.trim().toLowerCase()
  return normalized === 'united arab emirates' || normalized === 'uae'
}
