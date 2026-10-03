import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBestPracticesLibraryEngineQuery, ListBestPracticesLibraryProductsQuery } from './messages';
import {
  BEST_PRACTICES_LIBRARY_CATALOG_PORT,
  BestPracticesLibraryCatalogPort,
  BestPracticesLibraryEngineBundle,
  BestPracticesLibraryProductRow,
} from './ports';

@QueryHandler(GetBestPracticesLibraryEngineQuery)
export class GetBestPracticesLibraryEngineHandler implements IQueryHandler<GetBestPracticesLibraryEngineQuery> {
  constructor(
    @Inject(BEST_PRACTICES_LIBRARY_CATALOG_PORT)
    private readonly catalog: BestPracticesLibraryCatalogPort,
  ) {}

  execute(): Promise<BestPracticesLibraryEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListBestPracticesLibraryProductsQuery)
export class ListBestPracticesLibraryProductsHandler implements IQueryHandler<ListBestPracticesLibraryProductsQuery> {
  constructor(
    @Inject(BEST_PRACTICES_LIBRARY_CATALOG_PORT)
    private readonly catalog: BestPracticesLibraryCatalogPort,
  ) {}

  execute(): Promise<BestPracticesLibraryProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const BEST_PRACTICES_LIBRARY_HANDLERS = [GetBestPracticesLibraryEngineHandler, ListBestPracticesLibraryProductsHandler];
