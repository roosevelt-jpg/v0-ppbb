import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GlobalAiFederationService } from '../global-ai-federation.service';
import { GetGlobalAiFederationEngineQuery, ListGlobalAiFederationProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetGlobalAiFederationEngineQuery)
export class GetGlobalAiFederationEngineHandler implements IQueryHandler<GetGlobalAiFederationEngineQuery> {
  constructor(private readonly service: GlobalAiFederationService) {}
  execute() { return this.service.engine(); }
}

@Injectable()
@QueryHandler(ListGlobalAiFederationProductsQuery)
export class ListGlobalAiFederationProductsHandler implements IQueryHandler<ListGlobalAiFederationProductsQuery> {
  constructor(private readonly service: GlobalAiFederationService) {}
  execute() { return this.service.products(); }
}
