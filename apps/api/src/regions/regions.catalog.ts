export type RegionCode = 'af' | 'us' | 'eu';

export type RegionDefinition = {
  code: RegionCode;
  name: string;
  /** Fly primary_region for this residency island */
  flyRegion: string;
  residencyLabel: string;
  /** Public API base URL for this island (override via env). */
  apiBaseUrl: string;
  webBaseUrl: string;
};

const DEFAULTS: Record<RegionCode, Omit<RegionDefinition, 'apiBaseUrl' | 'webBaseUrl'>> = {
  af: {
    code: 'af',
    name: 'Africa',
    flyRegion: 'jnb',
    residencyLabel: 'Africa residency (Johannesburg)',
  },
  us: {
    code: 'us',
    name: 'United States',
    flyRegion: 'iad',
    residencyLabel: 'US / Americas',
  },
  eu: {
    code: 'eu',
    name: 'European Union',
    flyRegion: 'ams',
    residencyLabel: 'EU residency',
  },
};

export function isRegionCode(value: string): value is RegionCode {
  return value === 'af' || value === 'us' || value === 'eu';
}

/** Default residency island — Africa unless VERBALAB_REGION overrides. */
export const DEFAULT_REGION_CODE: RegionCode = 'af';

/** This process's residency island — set per Fly app (VERBALAB_REGION). */
export function currentRegionCode(): RegionCode {
  const raw = (process.env.VERBALAB_REGION ?? DEFAULT_REGION_CODE).trim().toLowerCase();
  return isRegionCode(raw) ? raw : DEFAULT_REGION_CODE;
}

function envUrl(code: RegionCode, kind: 'api' | 'web'): string {
  const upper = code.toUpperCase();
  const specific =
    kind === 'api'
      ? process.env[`VERBALAB_API_URL_${upper}`]
      : process.env[`VERBALAB_WEB_URL_${upper}`];
  if (specific?.trim()) return specific.trim().replace(/\/$/, '');

  const defaults: Record<RegionCode, { api: string; web: string }> = {
    af: {
      api: process.env.VERBALAB_API_URL_AF ?? 'https://verbalab-api.fly.dev',
      web: process.env.VERBALAB_WEB_URL_AF ?? 'https://verbalab-web.fly.dev',
    },
    us: {
      api: process.env.VERBALAB_API_URL_US ?? 'https://verbalab-api-us.fly.dev',
      web: process.env.VERBALAB_WEB_URL_US ?? 'https://verbalab-web-us.fly.dev',
    },
    eu: {
      api: process.env.VERBALAB_API_URL_EU ?? 'https://verbalab-api-eu.fly.dev',
      web: process.env.VERBALAB_WEB_URL_EU ?? 'https://verbalab-web-eu.fly.dev',
    },
  };
  return defaults[code][kind];
}

export function regionCatalog(): RegionDefinition[] {
  return (Object.keys(DEFAULTS) as RegionCode[]).map((code) => ({
    ...DEFAULTS[code],
    apiBaseUrl: envUrl(code, 'api'),
    webBaseUrl: envUrl(code, 'web'),
  }));
}

export function findRegion(code: string): RegionDefinition | undefined {
  return regionCatalog().find((r) => r.code === code);
}
