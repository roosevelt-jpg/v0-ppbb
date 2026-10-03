import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EnterpriseNationPlatformService } from '../enterprise-nation-platform.service';
import { GetEnterpriseNationPlatformEngineQuery, ListEnterpriseNationPlatformProductsQuery } from './messages';

@Injectable()
@QueryHandler(GetEnterpriseNationPlatformEngineQuery)
export class GetEnterpriseNationPlatformEngineHandler implements IQueryHandler<GetEnterpriseNationPlatformEngineQuery> {
  constructor(private readonly service: EnterpriseNationPlatformService) {}
  execute() { return this.service.engine(); }
}

@Injectable()
@QueryHandler(ListEnterpriseNationPlatformProductsQuery)
export class ListEnterpriseNationPlatformProductsHandler implements IQueryHandler<ListEnterpriseNationPlatformProductsQuery> {
  constructor(private readonly service: EnterpriseNationPlatformService) {}
  execute() { return this.service.products(); }
}
