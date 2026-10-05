import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetEnterprisePortfolioManagementEngineQuery, ListEnterprisePortfolioManagementProductsQuery } from './messages';
import {
  ENTERPRISE_PORTFOLIO_MANAGEMENT_CATALOG_PORT,
  EnterprisePortfolioManagementCatalogPort,
  EnterprisePortfolioManagementEngineBundle,
  EnterprisePortfolioManagementProductRow,
} from './ports';

@QueryHandler(GetEnterprisePortfolioManagementEngineQuery)
export class GetEnterprisePortfolioManagementEngineHandler implements IQueryHandler<GetEnterprisePortfolioManagementEngineQuery> {
  constructor(
    @Inject(ENTERPRISE_PORTFOLIO_MANAGEMENT_CATALOG_PORT)
    private readonly catalog: EnterprisePortfolioManagementCatalogPort,
  ) {}

  execute(): Promise<EnterprisePortfolioManagementEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListEnterprisePortfolioManagementProductsQuery)
export class ListEnterprisePortfolioManagementProductsHandler implements IQueryHandler<ListEnterprisePortfolioManagementProductsQuery> {
  constructor(
    @Inject(ENTERPRISE_PORTFOLIO_MANAGEMENT_CATALOG_PORT)
    private readonly catalog: EnterprisePortfolioManagementCatalogPort,
  ) {}

  execute(): Promise<EnterprisePortfolioManagementProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const ENTERPRISE_PORTFOLIO_MANAGEMENT_HANDLERS = [GetEnterprisePortfolioManagementEngineHandler, ListEnterprisePortfolioManagementProductsHandler];
