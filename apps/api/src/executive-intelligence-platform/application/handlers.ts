import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetExecutiveIntelligencePlatformEngineQuery, ListExecutiveIntelligencePlatformProductsQuery } from './messages';
import {
  EXECUTIVE_INTELLIGENCE_PLATFORM_CATALOG_PORT,
  ExecutiveIntelligencePlatformCatalogPort,
  ExecutiveIntelligencePlatformEngineBundle,
  ExecutiveIntelligencePlatformProductRow,
} from './ports';

@QueryHandler(GetExecutiveIntelligencePlatformEngineQuery)
export class GetExecutiveIntelligencePlatformEngineHandler implements IQueryHandler<GetExecutiveIntelligencePlatformEngineQuery> {
  constructor(
    @Inject(EXECUTIVE_INTELLIGENCE_PLATFORM_CATALOG_PORT)
    private readonly catalog: ExecutiveIntelligencePlatformCatalogPort,
  ) {}

  execute(): Promise<ExecutiveIntelligencePlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListExecutiveIntelligencePlatformProductsQuery)
export class ListExecutiveIntelligencePlatformProductsHandler implements IQueryHandler<ListExecutiveIntelligencePlatformProductsQuery> {
  constructor(
    @Inject(EXECUTIVE_INTELLIGENCE_PLATFORM_CATALOG_PORT)
    private readonly catalog: ExecutiveIntelligencePlatformCatalogPort,
  ) {}

  execute(): Promise<ExecutiveIntelligencePlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const EXECUTIVE_INTELLIGENCE_PLATFORM_HANDLERS = [GetExecutiveIntelligencePlatformEngineHandler, ListExecutiveIntelligencePlatformProductsHandler];
