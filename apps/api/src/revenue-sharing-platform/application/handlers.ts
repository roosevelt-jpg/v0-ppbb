import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RevenueSharingPlatformService } from '../revenue-sharing-platform.service';
import { GetRevenueSharingPlatformEngineQuery, ListRevenueSharingPlatformProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetRevenueSharingPlatformEngineQuery)
export class GetRevenueSharingPlatformEngineHandler implements IQueryHandler<GetRevenueSharingPlatformEngineQuery> {
  constructor(private readonly service: RevenueSharingPlatformService) {}
  execute() {
    return this.service.engine();
  }
}

@Injectable()
@QueryHandler(ListRevenueSharingPlatformProductsQuery)
export class ListRevenueSharingPlatformProductsHandler implements IQueryHandler<ListRevenueSharingPlatformProductsQuery> {
  constructor(private readonly service: RevenueSharingPlatformService) {}
  execute() {
    return this.service.products();
  }
}
