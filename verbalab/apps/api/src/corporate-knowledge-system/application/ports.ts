export type CorporateKnowledgeSystemProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type CorporateKnowledgeSystemEngineBundle = ReturnType<
  import('../corporate-knowledge-system.service').CorporateKnowledgeSystemService['engine']
>;

export interface CorporateKnowledgeSystemCatalogPort {
  engine(): CorporateKnowledgeSystemEngineBundle | Promise<CorporateKnowledgeSystemEngineBundle>;
  listProducts(): CorporateKnowledgeSystemProductRow[] | Promise<CorporateKnowledgeSystemProductRow[]>;
}

export const CORPORATE_KNOWLEDGE_SYSTEM_CATALOG_PORT = Symbol('CORPORATE_KNOWLEDGE_SYSTEM_CATALOG_PORT');
