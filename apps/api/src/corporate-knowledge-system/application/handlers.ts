import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCorporateKnowledgeSystemEngineQuery, ListCorporateKnowledgeSystemProductsQuery } from './messages';
import {
  CORPORATE_KNOWLEDGE_SYSTEM_CATALOG_PORT,
  CorporateKnowledgeSystemCatalogPort,
  CorporateKnowledgeSystemEngineBundle,
  CorporateKnowledgeSystemProductRow,
} from './ports';

@QueryHandler(GetCorporateKnowledgeSystemEngineQuery)
export class GetCorporateKnowledgeSystemEngineHandler implements IQueryHandler<GetCorporateKnowledgeSystemEngineQuery> {
  constructor(
    @Inject(CORPORATE_KNOWLEDGE_SYSTEM_CATALOG_PORT)
    private readonly catalog: CorporateKnowledgeSystemCatalogPort,
  ) {}

  execute(): Promise<CorporateKnowledgeSystemEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListCorporateKnowledgeSystemProductsQuery)
export class ListCorporateKnowledgeSystemProductsHandler implements IQueryHandler<ListCorporateKnowledgeSystemProductsQuery> {
  constructor(
    @Inject(CORPORATE_KNOWLEDGE_SYSTEM_CATALOG_PORT)
    private readonly catalog: CorporateKnowledgeSystemCatalogPort,
  ) {}

  execute(): Promise<CorporateKnowledgeSystemProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const CORPORATE_KNOWLEDGE_SYSTEM_HANDLERS = [GetCorporateKnowledgeSystemEngineHandler, ListCorporateKnowledgeSystemProductsHandler];
