import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CivilizationIntelligenceDashboardService } from '../civilization-intelligence-dashboard.service';
import { GetCivilizationIntelligenceDashboardEngineQuery, ListCivilizationIntelligenceDashboardProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetCivilizationIntelligenceDashboardEngineQuery)
export class GetCivilizationIntelligenceDashboardEngineHandler implements IQueryHandler<GetCivilizationIntelligenceDashboardEngineQuery> {
  constructor(private readonly service: CivilizationIntelligenceDashboardService) {}
  execute() { return this.service.engine(); }
}

@Injectable()
@QueryHandler(ListCivilizationIntelligenceDashboardProductsQuery)
export class ListCivilizationIntelligenceDashboardProductsHandler implements IQueryHandler<ListCivilizationIntelligenceDashboardProductsQuery> {
  constructor(private readonly service: CivilizationIntelligenceDashboardService) {}
  execute() { return this.service.products(); }
}
