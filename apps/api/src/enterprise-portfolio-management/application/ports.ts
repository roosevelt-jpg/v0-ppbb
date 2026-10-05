export type EnterprisePortfolioManagementProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type EnterprisePortfolioManagementEngineBundle = ReturnType<
  import('../enterprise-portfolio-management.service').EnterprisePortfolioManagementService['engine']
>;

export interface EnterprisePortfolioManagementCatalogPort {
  engine(): EnterprisePortfolioManagementEngineBundle | Promise<EnterprisePortfolioManagementEngineBundle>;
  listProducts(): EnterprisePortfolioManagementProductRow[] | Promise<EnterprisePortfolioManagementProductRow[]>;
}

export const ENTERPRISE_PORTFOLIO_MANAGEMENT_CATALOG_PORT = Symbol('ENTERPRISE_PORTFOLIO_MANAGEMENT_CATALOG_PORT');
