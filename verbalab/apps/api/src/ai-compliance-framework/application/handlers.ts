import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAiComplianceFrameworkEngineQuery, ListAiComplianceFrameworkProductsQuery } from './messages';
import {
  AI_COMPLIANCE_FRAMEWORK_CATALOG_PORT,
  AiComplianceFrameworkCatalogPort,
  AiComplianceFrameworkEngineBundle,
  AiComplianceFrameworkProductRow,
} from './ports';

@QueryHandler(GetAiComplianceFrameworkEngineQuery)
export class GetAiComplianceFrameworkEngineHandler implements IQueryHandler<GetAiComplianceFrameworkEngineQuery> {
  constructor(
    @Inject(AI_COMPLIANCE_FRAMEWORK_CATALOG_PORT)
    private readonly catalog: AiComplianceFrameworkCatalogPort,
  ) {}

  execute(): Promise<AiComplianceFrameworkEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListAiComplianceFrameworkProductsQuery)
export class ListAiComplianceFrameworkProductsHandler implements IQueryHandler<ListAiComplianceFrameworkProductsQuery> {
  constructor(
    @Inject(AI_COMPLIANCE_FRAMEWORK_CATALOG_PORT)
    private readonly catalog: AiComplianceFrameworkCatalogPort,
  ) {}

  execute(): Promise<AiComplianceFrameworkProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const AI_COMPLIANCE_FRAMEWORK_HANDLERS = [GetAiComplianceFrameworkEngineHandler, ListAiComplianceFrameworkProductsHandler];
