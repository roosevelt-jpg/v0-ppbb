import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCorporateGovernancePlatformEngineQuery, ListCorporateGovernancePlatformProductsQuery } from './messages';
import {
  CORPORATE_GOVERNANCE_PLATFORM_CATALOG_PORT,
  CorporateGovernancePlatformCatalogPort,
  CorporateGovernancePlatformEngineBundle,
  CorporateGovernancePlatformProductRow,
} from './ports';

@QueryHandler(GetCorporateGovernancePlatformEngineQuery)
export class GetCorporateGovernancePlatformEngineHandler implements IQueryHandler<GetCorporateGovernancePlatformEngineQuery> {
  constructor(
    @Inject(CORPORATE_GOVERNANCE_PLATFORM_CATALOG_PORT)
    private readonly catalog: CorporateGovernancePlatformCatalogPort,
  ) {}

  execute(): Promise<CorporateGovernancePlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListCorporateGovernancePlatformProductsQuery)
export class ListCorporateGovernancePlatformProductsHandler implements IQueryHandler<ListCorporateGovernancePlatformProductsQuery> {
  constructor(
    @Inject(CORPORATE_GOVERNANCE_PLATFORM_CATALOG_PORT)
    private readonly catalog: CorporateGovernancePlatformCatalogPort,
  ) {}

  execute(): Promise<CorporateGovernancePlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const CORPORATE_GOVERNANCE_PLATFORM_HANDLERS = [GetCorporateGovernancePlatformEngineHandler, ListCorporateGovernancePlatformProductsHandler];
