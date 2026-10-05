export type BestPracticesLibraryProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type BestPracticesLibraryEngineBundle = ReturnType<
  import('../best-practices-library.service').BestPracticesLibraryService['engine']
>;

export interface BestPracticesLibraryCatalogPort {
  engine(): BestPracticesLibraryEngineBundle | Promise<BestPracticesLibraryEngineBundle>;
  listProducts(): BestPracticesLibraryProductRow[] | Promise<BestPracticesLibraryProductRow[]>;
}

export const BEST_PRACTICES_LIBRARY_CATALOG_PORT = Symbol('BEST_PRACTICES_LIBRARY_CATALOG_PORT');
