import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DigitalCivilizationService } from '../digital-civilization.service';
import { GetDigitalCivilizationEngineQuery, ListDigitalCivilizationProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetDigitalCivilizationEngineQuery)
export class GetDigitalCivilizationEngineHandler implements IQueryHandler<GetDigitalCivilizationEngineQuery> {
  constructor(private readonly service: DigitalCivilizationService) {}
  execute() { return this.service.products(); }
}

@Injectable()
@QueryHandler(ListDigitalCivilizationProductsQuery)
export class ListDigitalCivilizationProductsHandler implements IQueryHandler<ListDigitalCivilizationProductsQuery> {
  constructor(private readonly service: DigitalCivilizationService) {}
  execute() { return this.service.products(); }
}
