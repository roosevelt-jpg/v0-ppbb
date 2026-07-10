import countries from 'world-countries'

export interface CountryOption {
  code: string
  name: string
}

/** Complete searchable country/nationality list from world-countries. */
export const COUNTRY_OPTIONS: CountryOption[] = countries
  .map((country) => ({
    code: country.cca2,
    name: country.name.common,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

export function filterCountries(query: string): CountryOption[] {
  const q = query.trim().toLowerCase()
  if (!q) return COUNTRY_OPTIONS
  return COUNTRY_OPTIONS.filter(
    (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
  )
}
