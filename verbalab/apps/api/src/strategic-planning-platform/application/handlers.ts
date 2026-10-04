import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetStrategicPlanningPlatformEngineQuery, ListStrategicPlanningPlatformProductsQuery } from './messages';
import {
  STRATEGIC_PLANNING_PLATFORM_CATALOG_PORT,
  StrategicPlanningPlatformCatalogPort,
  StrategicPlanningPlatformEngineBundle,
  StrategicPlanningPlatformProductRow,
} from './ports';

@QueryHandler(GetStrategicPlanningPlatformEngineQuery)
export class GetStrategicPlanningPlatformEngineHandler implements IQueryHandler<GetStrategicPlanningPlatformEngineQuery> {
  constructor(
    @Inject(STRATEGIC_PLANNING_PLATFORM_CATALOG_PORT)
    private readonly catalog: StrategicPlanningPlatformCatalogPort,
  ) {}

  execute(): Promise<StrategicPlanningPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListStrategicPlanningPlatformProductsQuery)
export class ListStrategicPlanningPlatformProductsHandler implements IQueryHandler<ListStrategicPlanningPlatformProductsQuery> {
  constructor(
    @Inject(STRATEGIC_PLANNING_PLATFORM_CATALOG_PORT)
    private readonly catalog: StrategicPlanningPlatformCatalogPort,
  ) {}

  execute(): Promise<StrategicPlanningPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const STRATEGIC_PLANNING_PLATFORM_HANDLERS = [GetStrategicPlanningPlatformEngineHandler, ListStrategicPlanningPlatformProductsHandler];
