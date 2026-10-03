import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetGlobalAiStandardsEngineQuery, ListGlobalAiStandardsProductsQuery } from './messages';
import {
  GLOBAL_AI_STANDARDS_CATALOG_PORT,
  GlobalAiStandardsCatalogPort,
  GlobalAiStandardsEngineBundle,
  GlobalAiStandardsProductRow,
} from './ports';

@QueryHandler(GetGlobalAiStandardsEngineQuery)
export class GetGlobalAiStandardsEngineHandler implements IQueryHandler<GetGlobalAiStandardsEngineQuery> {
  constructor(
    @Inject(GLOBAL_AI_STANDARDS_CATALOG_PORT)
    private readonly catalog: GlobalAiStandardsCatalogPort,
  ) {}

  execute(): Promise<GlobalAiStandardsEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListGlobalAiStandardsProductsQuery)
export class ListGlobalAiStandardsProductsHandler implements IQueryHandler<ListGlobalAiStandardsProductsQuery> {
  constructor(
    @Inject(GLOBAL_AI_STANDARDS_CATALOG_PORT)
    private readonly catalog: GlobalAiStandardsCatalogPort,
  ) {}

  execute(): Promise<GlobalAiStandardsProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const GLOBAL_AI_STANDARDS_HANDLERS = [GetGlobalAiStandardsEngineHandler, ListGlobalAiStandardsProductsHandler];
