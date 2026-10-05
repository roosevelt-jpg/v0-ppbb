export type GlobalPartnerProgramProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type GlobalPartnerProgramEngineBundle = ReturnType<
  import('../global-partner-program.service').GlobalPartnerProgramService['engine']
>;

export interface GlobalPartnerProgramCatalogPort {
  engine(): GlobalPartnerProgramEngineBundle | Promise<GlobalPartnerProgramEngineBundle>;
  listProducts(): GlobalPartnerProgramProductRow[] | Promise<GlobalPartnerProgramProductRow[]>;
}

export const GLOBAL_PARTNER_PROGRAM_CATALOG_PORT = Symbol('GLOBAL_PARTNER_PROGRAM_CATALOG_PORT');
