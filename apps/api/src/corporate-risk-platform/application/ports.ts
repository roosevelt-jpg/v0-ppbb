export type CorporateRiskPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type CorporateRiskPlatformEngineBundle = ReturnType<
  import('../corporate-risk-platform.service').CorporateRiskPlatformService['engine']
>;

export interface CorporateRiskPlatformCatalogPort {
  engine(): CorporateRiskPlatformEngineBundle | Promise<CorporateRiskPlatformEngineBundle>;
  listProducts(): CorporateRiskPlatformProductRow[] | Promise<CorporateRiskPlatformProductRow[]>;
}

export const CORPORATE_RISK_PLATFORM_CATALOG_PORT = Symbol('CORPORATE_RISK_PLATFORM_CATALOG_PORT');
