export type ExecutiveIntelligencePlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ExecutiveIntelligencePlatformEngineBundle = ReturnType<
  import('../executive-intelligence-platform.service').ExecutiveIntelligencePlatformService['engine']
>;

export interface ExecutiveIntelligencePlatformCatalogPort {
  engine(): ExecutiveIntelligencePlatformEngineBundle | Promise<ExecutiveIntelligencePlatformEngineBundle>;
  listProducts(): ExecutiveIntelligencePlatformProductRow[] | Promise<ExecutiveIntelligencePlatformProductRow[]>;
}

export const EXECUTIVE_INTELLIGENCE_PLATFORM_CATALOG_PORT = Symbol('EXECUTIVE_INTELLIGENCE_PLATFORM_CATALOG_PORT');
