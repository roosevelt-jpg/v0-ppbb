import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCorporateOperatingSystemEngineQuery, ListCorporateOperatingSystemProductsQuery } from './messages';
import {
  CORPORATE_OPERATING_SYSTEM_CATALOG_PORT,
  CorporateOperatingSystemCatalogPort,
  CorporateOperatingSystemEngineBundle,
  CorporateOperatingSystemProductRow,
} from './ports';

@QueryHandler(GetCorporateOperatingSystemEngineQuery)
export class GetCorporateOperatingSystemEngineHandler implements IQueryHandler<GetCorporateOperatingSystemEngineQuery> {
  constructor(
    @Inject(CORPORATE_OPERATING_SYSTEM_CATALOG_PORT)
    private readonly catalog: CorporateOperatingSystemCatalogPort,
  ) {}

  execute(): Promise<CorporateOperatingSystemEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListCorporateOperatingSystemProductsQuery)
export class ListCorporateOperatingSystemProductsHandler implements IQueryHandler<ListCorporateOperatingSystemProductsQuery> {
  constructor(
    @Inject(CORPORATE_OPERATING_SYSTEM_CATALOG_PORT)
    private readonly catalog: CorporateOperatingSystemCatalogPort,
  ) {}

  execute(): Promise<CorporateOperatingSystemProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const CORPORATE_OPERATING_SYSTEM_HANDLERS = [GetCorporateOperatingSystemEngineHandler, ListCorporateOperatingSystemProductsHandler];
