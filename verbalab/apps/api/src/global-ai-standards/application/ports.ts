export type GlobalAiStandardsProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type GlobalAiStandardsEngineBundle = ReturnType<
  import('../global-ai-standards.service').GlobalAiStandardsService['products']
>;

export interface GlobalAiStandardsCatalogPort {
  engine(): GlobalAiStandardsEngineBundle | Promise<GlobalAiStandardsEngineBundle>;
  listProducts(): GlobalAiStandardsProductRow[] | Promise<GlobalAiStandardsProductRow[]>;
}

export const GLOBAL_AI_STANDARDS_CATALOG_PORT = Symbol('GLOBAL_AI_STANDARDS_CATALOG_PORT');
