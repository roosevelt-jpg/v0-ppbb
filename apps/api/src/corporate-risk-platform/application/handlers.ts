import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCorporateRiskPlatformEngineQuery, ListCorporateRiskPlatformProductsQuery } from './messages';
import {
  CORPORATE_RISK_PLATFORM_CATALOG_PORT,
  CorporateRiskPlatformCatalogPort,
  CorporateRiskPlatformEngineBundle,
  CorporateRiskPlatformProductRow,
} from './ports';

@QueryHandler(GetCorporateRiskPlatformEngineQuery)
export class GetCorporateRiskPlatformEngineHandler implements IQueryHandler<GetCorporateRiskPlatformEngineQuery> {
  constructor(
    @Inject(CORPORATE_RISK_PLATFORM_CATALOG_PORT)
    private readonly catalog: CorporateRiskPlatformCatalogPort,
  ) {}

  execute(): Promise<CorporateRiskPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListCorporateRiskPlatformProductsQuery)
export class ListCorporateRiskPlatformProductsHandler implements IQueryHandler<ListCorporateRiskPlatformProductsQuery> {
  constructor(
    @Inject(CORPORATE_RISK_PLATFORM_CATALOG_PORT)
    private readonly catalog: CorporateRiskPlatformCatalogPort,
  ) {}

  execute(): Promise<CorporateRiskPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const CORPORATE_RISK_PLATFORM_HANDLERS = [GetCorporateRiskPlatformEngineHandler, ListCorporateRiskPlatformProductsHandler];
