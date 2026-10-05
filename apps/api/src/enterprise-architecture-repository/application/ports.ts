export type EnterpriseArchitectureRepositoryProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type EnterpriseArchitectureRepositoryEngineBundle = ReturnType<
  import('../enterprise-architecture-repository.service').EnterpriseArchitectureRepositoryService['engine']
>;

export interface EnterpriseArchitectureRepositoryCatalogPort {
  engine(): EnterpriseArchitectureRepositoryEngineBundle | Promise<EnterpriseArchitectureRepositoryEngineBundle>;
  listProducts(): EnterpriseArchitectureRepositoryProductRow[] | Promise<EnterpriseArchitectureRepositoryProductRow[]>;
}

export const ENTERPRISE_ARCHITECTURE_REPOSITORY_CATALOG_PORT = Symbol('ENTERPRISE_ARCHITECTURE_REPOSITORY_CATALOG_PORT');
