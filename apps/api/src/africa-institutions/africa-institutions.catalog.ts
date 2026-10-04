export function africaInstitutionsHonesty() {
  return {
    product: 'africa-institutions',
    shipped: true,
    note:
      'Africa Institutions Hub maps VerbaLab capabilities to culture, sovereignty, national pride, security, and justice — with live product links, not slogans.',
  };
}

export function africaInstitutionsCatalog() {
  return {
    id: 'africa-institutions',
    title: 'Africa Institutions Hub',
    blurb:
      'How VerbaLab serves culture, sovereignty, national pride, security, and justice across African institutions.',
    honesty: africaInstitutionsHonesty(),
    docs: '/docs/AFRICA_INSTITUTIONS.md',
    capabilities: [
      { id: 'pillars', name: 'Institution pillars map', status: 'shipped' as const, api: 'GET /v1/africa-institutions/pillars' },
      { id: 'playbooks', name: 'Institution playbooks', status: 'shipped' as const, api: 'GET /v1/africa-institutions/playbooks' },
      { id: 'route', name: 'Route need → product', status: 'shipped' as const, api: 'POST /v1/africa-institutions/route' },
    ],
  };
}
