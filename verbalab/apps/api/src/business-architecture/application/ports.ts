export type BusinessArchitectureProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type BusinessArchitectureEngineBundle = ReturnType<
  import('../business-architecture.service').BusinessArchitectureService['engine']
>;

export interface BusinessArchitectureCatalogPort {
  engine(): BusinessArchitectureEngineBundle | Promise<BusinessArchitectureEngineBundle>;
  listProducts(): BusinessArchitectureProductRow[] | Promise<BusinessArchitectureProductRow[]>;
}

export const BUSINESS_ARCHITECTURE_CATALOG_PORT = Symbol('BUSINESS_ARCHITECTURE_CATALOG_PORT');
