import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetCorporateGovernancePlatformEngineQuery } from '../corporate-governance-platform/application/messages';
import { GqlCorporateGovernancePlatformEngine } from './gql.types';

@Resolver()
export class CorporateGovernancePlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlCorporateGovernancePlatformEngine, { name: 'corporateGovernancePlatformEngine' })
  async corporateGovernancePlatformEngine(): Promise<GqlCorporateGovernancePlatformEngine> {
    const catalog = await this.queries.execute(new GetCorporateGovernancePlatformEngineQuery());
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
