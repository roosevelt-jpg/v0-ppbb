import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LibraryReferenceService } from '../library-reference.service';
import { GetLibraryReferenceEngineQuery, ListLibraryReferenceProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetLibraryReferenceEngineQuery)
export class GetLibraryReferenceEngineHandler implements IQueryHandler<GetLibraryReferenceEngineQuery> {
  constructor(private readonly service: LibraryReferenceService) {}
  execute() {
    return this.service.products();
  }
}

@Injectable()
@QueryHandler(ListLibraryReferenceProductsQuery)
export class ListLibraryReferenceProductsHandler implements IQueryHandler<ListLibraryReferenceProductsQuery> {
  constructor(private readonly service: LibraryReferenceService) {}
  execute() {
    return this.service.products();
  }
}
