import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetReferenceArchitecturesEngineQuery, ListReferenceArchitecturesProductsQuery } from './messages';
import {
  REFERENCE_ARCHITECTURES_CATALOG_PORT,
  ReferenceArchitecturesCatalogPort,
  ReferenceArchitecturesEngineBundle,
  ReferenceArchitecturesProductRow,
} from './ports';

@QueryHandler(GetReferenceArchitecturesEngineQuery)
export class GetReferenceArchitecturesEngineHandler implements IQueryHandler<GetReferenceArchitecturesEngineQuery> {
  constructor(
    @Inject(REFERENCE_ARCHITECTURES_CATALOG_PORT)
    private readonly catalog: ReferenceArchitecturesCatalogPort,
  ) {}

  execute(): Promise<ReferenceArchitecturesEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListReferenceArchitecturesProductsQuery)
export class ListReferenceArchitecturesProductsHandler implements IQueryHandler<ListReferenceArchitecturesProductsQuery> {
  constructor(
    @Inject(REFERENCE_ARCHITECTURES_CATALOG_PORT)
    private readonly catalog: ReferenceArchitecturesCatalogPort,
  ) {}

  execute(): Promise<ReferenceArchitecturesProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const REFERENCE_ARCHITECTURES_HANDLERS = [GetReferenceArchitecturesEngineHandler, ListReferenceArchitecturesProductsHandler];
