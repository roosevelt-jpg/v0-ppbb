export type CorporateGovernancePlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type CorporateGovernancePlatformEngineBundle = ReturnType<
  import('../corporate-governance-platform.service').CorporateGovernancePlatformService['engine']
>;

export interface CorporateGovernancePlatformCatalogPort {
  engine(): CorporateGovernancePlatformEngineBundle | Promise<CorporateGovernancePlatformEngineBundle>;
  listProducts(): CorporateGovernancePlatformProductRow[] | Promise<CorporateGovernancePlatformProductRow[]>;
}

export const CORPORATE_GOVERNANCE_PLATFORM_CATALOG_PORT = Symbol('CORPORATE_GOVERNANCE_PLATFORM_CATALOG_PORT');
