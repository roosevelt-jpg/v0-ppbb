import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetStandardsAnalyticsEngineQuery, ListStandardsAnalyticsProductsQuery } from './messages';
import {
  STANDARDS_ANALYTICS_CATALOG_PORT,
  StandardsAnalyticsCatalogPort,
  StandardsAnalyticsEngineBundle,
  StandardsAnalyticsProductRow,
} from './ports';

@QueryHandler(GetStandardsAnalyticsEngineQuery)
export class GetStandardsAnalyticsEngineHandler implements IQueryHandler<GetStandardsAnalyticsEngineQuery> {
  constructor(
    @Inject(STANDARDS_ANALYTICS_CATALOG_PORT)
    private readonly catalog: StandardsAnalyticsCatalogPort,
  ) {}

  execute(): Promise<StandardsAnalyticsEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListStandardsAnalyticsProductsQuery)
export class ListStandardsAnalyticsProductsHandler implements IQueryHandler<ListStandardsAnalyticsProductsQuery> {
  constructor(
    @Inject(STANDARDS_ANALYTICS_CATALOG_PORT)
    private readonly catalog: StandardsAnalyticsCatalogPort,
  ) {}

  execute(): Promise<StandardsAnalyticsProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const STANDARDS_ANALYTICS_HANDLERS = [GetStandardsAnalyticsEngineHandler, ListStandardsAnalyticsProductsHandler];
