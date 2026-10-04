import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SmartCityPlatformService } from '../smart-city-platform.service';
import { GetSmartCityPlatformEngineQuery, ListSmartCityPlatformProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetSmartCityPlatformEngineQuery)
export class GetSmartCityPlatformEngineHandler implements IQueryHandler<GetSmartCityPlatformEngineQuery> {
  constructor(private readonly service: SmartCityPlatformService) {}
  execute() { return this.service.engine(); }
}

@Injectable()
@QueryHandler(ListSmartCityPlatformProductsQuery)
export class ListSmartCityPlatformProductsHandler implements IQueryHandler<ListSmartCityPlatformProductsQuery> {
  constructor(private readonly service: SmartCityPlatformService) {}
  execute() { return this.service.products(); }
}
