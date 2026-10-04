import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBusinessArchitectureEngineQuery, ListBusinessArchitectureProductsQuery } from './messages';
import {
  BUSINESS_ARCHITECTURE_CATALOG_PORT,
  BusinessArchitectureCatalogPort,
  BusinessArchitectureEngineBundle,
  BusinessArchitectureProductRow,
} from './ports';

@QueryHandler(GetBusinessArchitectureEngineQuery)
export class GetBusinessArchitectureEngineHandler implements IQueryHandler<GetBusinessArchitectureEngineQuery> {
  constructor(
    @Inject(BUSINESS_ARCHITECTURE_CATALOG_PORT)
    private readonly catalog: BusinessArchitectureCatalogPort,
  ) {}

  execute(): Promise<BusinessArchitectureEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListBusinessArchitectureProductsQuery)
export class ListBusinessArchitectureProductsHandler implements IQueryHandler<ListBusinessArchitectureProductsQuery> {
  constructor(
    @Inject(BUSINESS_ARCHITECTURE_CATALOG_PORT)
    private readonly catalog: BusinessArchitectureCatalogPort,
  ) {}

  execute(): Promise<BusinessArchitectureProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const BUSINESS_ARCHITECTURE_HANDLERS = [GetBusinessArchitectureEngineHandler, ListBusinessArchitectureProductsHandler];
