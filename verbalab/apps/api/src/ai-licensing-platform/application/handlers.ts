import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AiLicensingPlatformService } from '../ai-licensing-platform.service';
import { GetAiLicensingPlatformEngineQuery, ListAiLicensingPlatformProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetAiLicensingPlatformEngineQuery)
export class GetAiLicensingPlatformEngineHandler implements IQueryHandler<GetAiLicensingPlatformEngineQuery> {
  constructor(private readonly service: AiLicensingPlatformService) {}
  execute() {
    return this.service.engine();
  }
}

@Injectable()
@QueryHandler(ListAiLicensingPlatformProductsQuery)
export class ListAiLicensingPlatformProductsHandler implements IQueryHandler<ListAiLicensingPlatformProductsQuery> {
  constructor(private readonly service: AiLicensingPlatformService) {}
  execute() {
    return this.service.products();
  }
}
