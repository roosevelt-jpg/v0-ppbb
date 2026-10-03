import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AiCommercePlatformService } from '../ai-commerce-platform.service';
import { GetAiCommercePlatformEngineQuery, ListAiCommercePlatformProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetAiCommercePlatformEngineQuery)
export class GetAiCommercePlatformEngineHandler implements IQueryHandler<GetAiCommercePlatformEngineQuery> {
  constructor(private readonly service: AiCommercePlatformService) {}
  execute() {
    return this.service.engine();
  }
}

@Injectable()
@QueryHandler(ListAiCommercePlatformProductsQuery)
export class ListAiCommercePlatformProductsHandler implements IQueryHandler<ListAiCommercePlatformProductsQuery> {
  constructor(private readonly service: AiCommercePlatformService) {}
  execute() {
    return this.service.products();
  }
}
