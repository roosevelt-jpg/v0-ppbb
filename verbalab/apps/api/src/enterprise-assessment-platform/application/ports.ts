export type EnterpriseAssessmentPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type EnterpriseAssessmentPlatformEngineBundle = ReturnType<
  import('../enterprise-assessment-platform.service').EnterpriseAssessmentPlatformService['engine']
>;

export interface EnterpriseAssessmentPlatformCatalogPort {
  engine(): EnterpriseAssessmentPlatformEngineBundle | Promise<EnterpriseAssessmentPlatformEngineBundle>;
  listProducts(): EnterpriseAssessmentPlatformProductRow[] | Promise<EnterpriseAssessmentPlatformProductRow[]>;
}

export const ENTERPRISE_ASSESSMENT_PLATFORM_CATALOG_PORT = Symbol('ENTERPRISE_ASSESSMENT_PLATFORM_CATALOG_PORT');
