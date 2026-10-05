import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetEnterpriseArchitectureRepositoryEngineQuery, ListEnterpriseArchitectureRepositoryProductsQuery } from './messages';
import {
  ENTERPRISE_ARCHITECTURE_REPOSITORY_CATALOG_PORT,
  EnterpriseArchitectureRepositoryCatalogPort,
  EnterpriseArchitectureRepositoryEngineBundle,
  EnterpriseArchitectureRepositoryProductRow,
} from './ports';

@QueryHandler(GetEnterpriseArchitectureRepositoryEngineQuery)
export class GetEnterpriseArchitectureRepositoryEngineHandler implements IQueryHandler<GetEnterpriseArchitectureRepositoryEngineQuery> {
  constructor(
    @Inject(ENTERPRISE_ARCHITECTURE_REPOSITORY_CATALOG_PORT)
    private readonly catalog: EnterpriseArchitectureRepositoryCatalogPort,
  ) {}

  execute(): Promise<EnterpriseArchitectureRepositoryEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListEnterpriseArchitectureRepositoryProductsQuery)
export class ListEnterpriseArchitectureRepositoryProductsHandler implements IQueryHandler<ListEnterpriseArchitectureRepositoryProductsQuery> {
  constructor(
    @Inject(ENTERPRISE_ARCHITECTURE_REPOSITORY_CATALOG_PORT)
    private readonly catalog: EnterpriseArchitectureRepositoryCatalogPort,
  ) {}

  execute(): Promise<EnterpriseArchitectureRepositoryProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const ENTERPRISE_ARCHITECTURE_REPOSITORY_HANDLERS = [GetEnterpriseArchitectureRepositoryEngineHandler, ListEnterpriseArchitectureRepositoryProductsHandler];
