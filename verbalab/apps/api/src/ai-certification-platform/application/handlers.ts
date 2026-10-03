import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAiCertificationPlatformEngineQuery, ListAiCertificationPlatformProductsQuery } from './messages';
import {
  AI_CERTIFICATION_PLATFORM_CATALOG_PORT,
  AiCertificationPlatformCatalogPort,
  AiCertificationPlatformEngineBundle,
  AiCertificationPlatformProductRow,
} from './ports';

@QueryHandler(GetAiCertificationPlatformEngineQuery)
export class GetAiCertificationPlatformEngineHandler implements IQueryHandler<GetAiCertificationPlatformEngineQuery> {
  constructor(
    @Inject(AI_CERTIFICATION_PLATFORM_CATALOG_PORT)
    private readonly catalog: AiCertificationPlatformCatalogPort,
  ) {}

  execute(): Promise<AiCertificationPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListAiCertificationPlatformProductsQuery)
export class ListAiCertificationPlatformProductsHandler implements IQueryHandler<ListAiCertificationPlatformProductsQuery> {
  constructor(
    @Inject(AI_CERTIFICATION_PLATFORM_CATALOG_PORT)
    private readonly catalog: AiCertificationPlatformCatalogPort,
  ) {}

  execute(): Promise<AiCertificationPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const AI_CERTIFICATION_PLATFORM_HANDLERS = [GetAiCertificationPlatformEngineHandler, ListAiCertificationPlatformProductsHandler];
