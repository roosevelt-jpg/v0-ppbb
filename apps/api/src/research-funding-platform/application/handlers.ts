import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ResearchFundingPlatformService } from '../research-funding-platform.service';
import { GetResearchFundingPlatformEngineQuery, ListResearchFundingPlatformProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetResearchFundingPlatformEngineQuery)
export class GetResearchFundingPlatformEngineHandler implements IQueryHandler<GetResearchFundingPlatformEngineQuery> {
  constructor(private readonly service: ResearchFundingPlatformService) {}
  execute() {
    return this.service.engine();
  }
}

@Injectable()
@QueryHandler(ListResearchFundingPlatformProductsQuery)
export class ListResearchFundingPlatformProductsHandler implements IQueryHandler<ListResearchFundingPlatformProductsQuery> {
  constructor(private readonly service: ResearchFundingPlatformService) {}
  execute() {
    return this.service.products();
  }
}
