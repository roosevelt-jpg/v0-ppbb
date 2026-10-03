import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetCorporateOperatingSystemEngineQuery } from '../corporate-operating-system/application/messages';
import { GqlCorporateOperatingSystemEngine } from './gql.types';

@Resolver()
export class CorporateOperatingSystemGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlCorporateOperatingSystemEngine, { name: 'corporateOperatingSystemEngine' })
  async corporateOperatingSystemEngine(): Promise<GqlCorporateOperatingSystemEngine> {
    const catalog = await this.queries.execute(new GetCorporateOperatingSystemEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      internalBusinessSoftware: catalog.honesty.internalBusinessSoftware,
      realCorporateGovernance: catalog.honesty.realCorporateGovernance,
      boardOs: catalog.honesty.boardOs,
      legalCounselOs: catalog.honesty.legalCounselOs,
    };
  }
}
