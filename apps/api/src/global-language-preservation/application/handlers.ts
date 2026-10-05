import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GlobalLanguagePreservationService } from '../global-language-preservation.service';
import { GetGlobalLanguagePreservationEngineQuery, ListGlobalLanguagePreservationProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetGlobalLanguagePreservationEngineQuery)
export class GetGlobalLanguagePreservationEngineHandler implements IQueryHandler<GetGlobalLanguagePreservationEngineQuery> {
  constructor(private readonly service: GlobalLanguagePreservationService) {}
  execute() { return this.service.engine(); }
}

@Injectable()
@QueryHandler(ListGlobalLanguagePreservationProductsQuery)
export class ListGlobalLanguagePreservationProductsHandler implements IQueryHandler<ListGlobalLanguagePreservationProductsQuery> {
  constructor(private readonly service: GlobalLanguagePreservationService) {}
  execute() { return this.service.products(); }
}
