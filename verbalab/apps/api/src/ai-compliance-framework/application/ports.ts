export type AiComplianceFrameworkProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AiComplianceFrameworkEngineBundle = ReturnType<
  import('../ai-compliance-framework.service').AiComplianceFrameworkService['engine']
>;

export interface AiComplianceFrameworkCatalogPort {
  engine(): AiComplianceFrameworkEngineBundle | Promise<AiComplianceFrameworkEngineBundle>;
  listProducts(): AiComplianceFrameworkProductRow[] | Promise<AiComplianceFrameworkProductRow[]>;
}

export const AI_COMPLIANCE_FRAMEWORK_CATALOG_PORT = Symbol('AI_COMPLIANCE_FRAMEWORK_CATALOG_PORT');
