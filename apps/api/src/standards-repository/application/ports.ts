export type StandardsRepositoryProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type StandardsRepositoryEngineBundle = ReturnType<
  import('../standards-repository.service').StandardsRepositoryService['engine']
>;

export interface StandardsRepositoryCatalogPort {
  engine(): StandardsRepositoryEngineBundle | Promise<StandardsRepositoryEngineBundle>;
  listProducts(): StandardsRepositoryProductRow[] | Promise<StandardsRepositoryProductRow[]>;
}

export const STANDARDS_REPOSITORY_CATALOG_PORT = Symbol('STANDARDS_REPOSITORY_CATALOG_PORT');
