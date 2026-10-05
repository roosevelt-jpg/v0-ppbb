export type CorporateOperatingSystemProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type CorporateOperatingSystemEngineBundle = ReturnType<
  import('../corporate-operating-system.service').CorporateOperatingSystemService['products']
>;

export interface CorporateOperatingSystemCatalogPort {
  engine(): CorporateOperatingSystemEngineBundle | Promise<CorporateOperatingSystemEngineBundle>;
  listProducts(): CorporateOperatingSystemProductRow[] | Promise<CorporateOperatingSystemProductRow[]>;
}

export const CORPORATE_OPERATING_SYSTEM_CATALOG_PORT = Symbol('CORPORATE_OPERATING_SYSTEM_CATALOG_PORT');
