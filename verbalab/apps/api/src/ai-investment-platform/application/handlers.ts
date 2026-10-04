import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AiInvestmentPlatformService } from '../ai-investment-platform.service';
import { GetAiInvestmentPlatformEngineQuery, ListAiInvestmentPlatformProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetAiInvestmentPlatformEngineQuery)
export class GetAiInvestmentPlatformEngineHandler implements IQueryHandler<GetAiInvestmentPlatformEngineQuery> {
  constructor(private readonly service: AiInvestmentPlatformService) {}
  execute() {
    return this.service.engine();
  }
}

@Injectable()
@QueryHandler(ListAiInvestmentPlatformProductsQuery)
export class ListAiInvestmentPlatformProductsHandler implements IQueryHandler<ListAiInvestmentPlatformProductsQuery> {
  constructor(private readonly service: AiInvestmentPlatformService) {}
  execute() {
    return this.service.products();
  }
}
