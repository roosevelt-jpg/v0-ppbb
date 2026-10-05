import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetStandardsRepositoryEngineQuery, ListStandardsRepositoryProductsQuery } from './messages';
import {
  STANDARDS_REPOSITORY_CATALOG_PORT,
  StandardsRepositoryCatalogPort,
  StandardsRepositoryEngineBundle,
  StandardsRepositoryProductRow,
} from './ports';

@QueryHandler(GetStandardsRepositoryEngineQuery)
export class GetStandardsRepositoryEngineHandler implements IQueryHandler<GetStandardsRepositoryEngineQuery> {
  constructor(
    @Inject(STANDARDS_REPOSITORY_CATALOG_PORT)
    private readonly catalog: StandardsRepositoryCatalogPort,
  ) {}

  execute(): Promise<StandardsRepositoryEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListStandardsRepositoryProductsQuery)
export class ListStandardsRepositoryProductsHandler implements IQueryHandler<ListStandardsRepositoryProductsQuery> {
  constructor(
    @Inject(STANDARDS_REPOSITORY_CATALOG_PORT)
    private readonly catalog: StandardsRepositoryCatalogPort,
  ) {}

  execute(): Promise<StandardsRepositoryProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const STANDARDS_REPOSITORY_HANDLERS = [GetStandardsRepositoryEngineHandler, ListStandardsRepositoryProductsHandler];
