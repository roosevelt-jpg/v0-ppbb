import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GlobalKnowledgeNetworkService } from '../global-knowledge-network.service';
import { GetGlobalKnowledgeNetworkEngineQuery, ListGlobalKnowledgeNetworkProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetGlobalKnowledgeNetworkEngineQuery)
export class GetGlobalKnowledgeNetworkEngineHandler implements IQueryHandler<GetGlobalKnowledgeNetworkEngineQuery> {
  constructor(private readonly service: GlobalKnowledgeNetworkService) {}
  execute() { return this.service.engine(); }
}

@Injectable()
@QueryHandler(ListGlobalKnowledgeNetworkProductsQuery)
export class ListGlobalKnowledgeNetworkProductsHandler implements IQueryHandler<ListGlobalKnowledgeNetworkProductsQuery> {
  constructor(private readonly service: GlobalKnowledgeNetworkService) {}
  execute() { return this.service.products(); }
}
