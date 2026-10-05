import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniversalTranslationGridService } from '../universal-translation-grid.service';
import { GetUniversalTranslationGridEngineQuery, ListUniversalTranslationGridProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetUniversalTranslationGridEngineQuery)
export class GetUniversalTranslationGridEngineHandler implements IQueryHandler<GetUniversalTranslationGridEngineQuery> {
  constructor(private readonly service: UniversalTranslationGridService) {}
  execute() { return this.service.engine(); }
}

@Injectable()
@QueryHandler(ListUniversalTranslationGridProductsQuery)
export class ListUniversalTranslationGridProductsHandler implements IQueryHandler<ListUniversalTranslationGridProductsQuery> {
  constructor(private readonly service: UniversalTranslationGridService) {}
  execute() { return this.service.products(); }
}
