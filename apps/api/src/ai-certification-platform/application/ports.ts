export type AiCertificationPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AiCertificationPlatformEngineBundle = ReturnType<
  import('../ai-certification-platform.service').AiCertificationPlatformService['engine']
>;

export interface AiCertificationPlatformCatalogPort {
  engine(): AiCertificationPlatformEngineBundle | Promise<AiCertificationPlatformEngineBundle>;
  listProducts(): AiCertificationPlatformProductRow[] | Promise<AiCertificationPlatformProductRow[]>;
}

export const AI_CERTIFICATION_PLATFORM_CATALOG_PORT = Symbol('AI_CERTIFICATION_PLATFORM_CATALOG_PORT');
