import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetCorporateRiskPlatformEngineQuery } from '../corporate-risk-platform/application/messages';
import { GqlCorporateRiskPlatformEngine } from './gql.types';

@Resolver()
export class CorporateRiskPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlCorporateRiskPlatformEngine, { name: 'corporateRiskPlatformEngine' })
  async corporateRiskPlatformEngine(): Promise<GqlCorporateRiskPlatformEngine> {
    const catalog = await this.queries.execute(new GetCorporateRiskPlatformEngineQuery());
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
