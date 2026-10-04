import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetWorldLanguageRegistryEngineQuery, ListWorldLanguageRegistryProductsQuery } from './messages';
import {
  WORLD_LANGUAGE_REGISTRY_CATALOG_PORT,
  WorldLanguageRegistryCatalogPort,
  WorldLanguageRegistryEngineBundle,
  WorldLanguageRegistryProductRow,
} from './ports';

@QueryHandler(GetWorldLanguageRegistryEngineQuery)
export class GetWorldLanguageRegistryEngineHandler
  implements IQueryHandler<GetWorldLanguageRegistryEngineQuery>
{
  constructor(
    @Inject(WORLD_LANGUAGE_REGISTRY_CATALOG_PORT)
    private readonly catalog: WorldLanguageRegistryCatalogPort,
  ) {}

  execute(): Promise<WorldLanguageRegistryEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListWorldLanguageRegistryProductsQuery)
export class ListWorldLanguageRegistryProductsHandler
  implements IQueryHandler<ListWorldLanguageRegistryProductsQuery>
{
  constructor(
    @Inject(WORLD_LANGUAGE_REGISTRY_CATALOG_PORT)
    private readonly catalog: WorldLanguageRegistryCatalogPort,
  ) {}

  execute(): Promise<WorldLanguageRegistryProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const WORLD_LANGUAGE_REGISTRY_HANDLERS = [
  GetWorldLanguageRegistryEngineHandler,
  ListWorldLanguageRegistryProductsHandler,
];
