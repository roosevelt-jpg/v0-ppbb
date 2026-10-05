/** Application ports for World Language Registry. */

export type WorldLanguageRegistryProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type WorldLanguageRegistryEngineBundle = ReturnType<
  import('../world-language-registry.service').WorldLanguageRegistryService['engine']
>;

export interface WorldLanguageRegistryCatalogPort {
  engine(): WorldLanguageRegistryEngineBundle;
  listProducts(): WorldLanguageRegistryProductRow[];
}

export const WORLD_LANGUAGE_REGISTRY_CATALOG_PORT = Symbol('WORLD_LANGUAGE_REGISTRY_CATALOG_PORT');
