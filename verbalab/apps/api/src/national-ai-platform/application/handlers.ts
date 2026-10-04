import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NationalAiPlatformService } from '../national-ai-platform.service';
import { GetNationalAiPlatformEngineQuery, ListNationalAiPlatformProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetNationalAiPlatformEngineQuery)
export class GetNationalAiPlatformEngineHandler implements IQueryHandler<GetNationalAiPlatformEngineQuery> {
  constructor(private readonly service: NationalAiPlatformService) {}
  execute() { return this.service.engine(); }
}

@Injectable()
@QueryHandler(ListNationalAiPlatformProductsQuery)
export class ListNationalAiPlatformProductsHandler implements IQueryHandler<ListNationalAiPlatformProductsQuery> {
  constructor(private readonly service: NationalAiPlatformService) {}
  execute() { return this.service.products(); }
}
