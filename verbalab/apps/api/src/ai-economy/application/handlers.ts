import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AiEconomyService } from '../ai-economy.service';
import { GetAiEconomyEngineQuery, ListAiEconomyProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetAiEconomyEngineQuery)
export class GetAiEconomyEngineHandler implements IQueryHandler<GetAiEconomyEngineQuery> {
  constructor(private readonly service: AiEconomyService) {}
  execute() {
    return this.service.products();
  }
}

@Injectable()
@QueryHandler(ListAiEconomyProductsQuery)
export class ListAiEconomyProductsHandler implements IQueryHandler<ListAiEconomyProductsQuery> {
  constructor(private readonly service: AiEconomyService) {}
  execute() {
    return this.service.products();
  }
}
