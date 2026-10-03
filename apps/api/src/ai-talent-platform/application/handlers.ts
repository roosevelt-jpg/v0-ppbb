import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AiTalentPlatformService } from '../ai-talent-platform.service';
import { GetAiTalentPlatformEngineQuery, ListAiTalentPlatformProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetAiTalentPlatformEngineQuery)
export class GetAiTalentPlatformEngineHandler implements IQueryHandler<GetAiTalentPlatformEngineQuery> {
  constructor(private readonly service: AiTalentPlatformService) {}
  execute() {
    return this.service.engine();
  }
}

@Injectable()
@QueryHandler(ListAiTalentPlatformProductsQuery)
export class ListAiTalentPlatformProductsHandler implements IQueryHandler<ListAiTalentPlatformProductsQuery> {
  constructor(private readonly service: AiTalentPlatformService) {}
  execute() {
    return this.service.products();
  }
}
