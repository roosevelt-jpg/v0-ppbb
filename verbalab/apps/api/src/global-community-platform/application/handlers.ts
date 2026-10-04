import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GlobalCommunityPlatformService } from '../global-community-platform.service';
import { GetGlobalCommunityPlatformEngineQuery, ListGlobalCommunityPlatformProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetGlobalCommunityPlatformEngineQuery)
export class GetGlobalCommunityPlatformEngineHandler implements IQueryHandler<GetGlobalCommunityPlatformEngineQuery> {
  constructor(private readonly service: GlobalCommunityPlatformService) {}
  execute() {
    return this.service.engine();
  }
}

@Injectable()
@QueryHandler(ListGlobalCommunityPlatformProductsQuery)
export class ListGlobalCommunityPlatformProductsHandler implements IQueryHandler<ListGlobalCommunityPlatformProductsQuery> {
  constructor(private readonly service: GlobalCommunityPlatformService) {}
  execute() {
    return this.service.products();
  }
}
