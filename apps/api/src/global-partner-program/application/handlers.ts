import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetGlobalPartnerProgramEngineQuery, ListGlobalPartnerProgramProductsQuery } from './messages';
import {
  GLOBAL_PARTNER_PROGRAM_CATALOG_PORT,
  GlobalPartnerProgramCatalogPort,
  GlobalPartnerProgramEngineBundle,
  GlobalPartnerProgramProductRow,
} from './ports';

@QueryHandler(GetGlobalPartnerProgramEngineQuery)
export class GetGlobalPartnerProgramEngineHandler implements IQueryHandler<GetGlobalPartnerProgramEngineQuery> {
  constructor(
    @Inject(GLOBAL_PARTNER_PROGRAM_CATALOG_PORT)
    private readonly catalog: GlobalPartnerProgramCatalogPort,
  ) {}

  execute(): Promise<GlobalPartnerProgramEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListGlobalPartnerProgramProductsQuery)
export class ListGlobalPartnerProgramProductsHandler implements IQueryHandler<ListGlobalPartnerProgramProductsQuery> {
  constructor(
    @Inject(GLOBAL_PARTNER_PROGRAM_CATALOG_PORT)
    private readonly catalog: GlobalPartnerProgramCatalogPort,
  ) {}

  execute(): Promise<GlobalPartnerProgramProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const GLOBAL_PARTNER_PROGRAM_HANDLERS = [GetGlobalPartnerProgramEngineHandler, ListGlobalPartnerProgramProductsHandler];
