import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetEnterpriseAssessmentPlatformEngineQuery, ListEnterpriseAssessmentPlatformProductsQuery } from './messages';
import {
  ENTERPRISE_ASSESSMENT_PLATFORM_CATALOG_PORT,
  EnterpriseAssessmentPlatformCatalogPort,
  EnterpriseAssessmentPlatformEngineBundle,
  EnterpriseAssessmentPlatformProductRow,
} from './ports';

@QueryHandler(GetEnterpriseAssessmentPlatformEngineQuery)
export class GetEnterpriseAssessmentPlatformEngineHandler implements IQueryHandler<GetEnterpriseAssessmentPlatformEngineQuery> {
  constructor(
    @Inject(ENTERPRISE_ASSESSMENT_PLATFORM_CATALOG_PORT)
    private readonly catalog: EnterpriseAssessmentPlatformCatalogPort,
  ) {}

  execute(): Promise<EnterpriseAssessmentPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListEnterpriseAssessmentPlatformProductsQuery)
export class ListEnterpriseAssessmentPlatformProductsHandler implements IQueryHandler<ListEnterpriseAssessmentPlatformProductsQuery> {
  constructor(
    @Inject(ENTERPRISE_ASSESSMENT_PLATFORM_CATALOG_PORT)
    private readonly catalog: EnterpriseAssessmentPlatformCatalogPort,
  ) {}

  execute(): Promise<EnterpriseAssessmentPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const ENTERPRISE_ASSESSMENT_PLATFORM_HANDLERS = [GetEnterpriseAssessmentPlatformEngineHandler, ListEnterpriseAssessmentPlatformProductsHandler];
