export type ReferenceArchitecturesProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ReferenceArchitecturesEngineBundle = ReturnType<
  import('../reference-architectures.service').ReferenceArchitecturesService['engine']
>;

export interface ReferenceArchitecturesCatalogPort {
  engine(): ReferenceArchitecturesEngineBundle | Promise<ReferenceArchitecturesEngineBundle>;
  listProducts(): ReferenceArchitecturesProductRow[] | Promise<ReferenceArchitecturesProductRow[]>;
}

export const REFERENCE_ARCHITECTURES_CATALOG_PORT = Symbol('REFERENCE_ARCHITECTURES_CATALOG_PORT');
