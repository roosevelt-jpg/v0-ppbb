import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EconomicIntelligenceService } from '../economic-intelligence.service';
import { GetEconomicIntelligenceEngineQuery, ListEconomicIntelligenceProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetEconomicIntelligenceEngineQuery)
export class GetEconomicIntelligenceEngineHandler implements IQueryHandler<GetEconomicIntelligenceEngineQuery> {
  constructor(private readonly service: EconomicIntelligenceService) {}
  execute() {
    return this.service.engine();
  }
}

@Injectable()
@QueryHandler(ListEconomicIntelligenceProductsQuery)
export class ListEconomicIntelligenceProductsHandler implements IQueryHandler<ListEconomicIntelligenceProductsQuery> {
  constructor(private readonly service: EconomicIntelligenceService) {}
  execute() {
    return this.service.products();
  }
}
