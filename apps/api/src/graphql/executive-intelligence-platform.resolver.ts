import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetExecutiveIntelligencePlatformEngineQuery } from '../executive-intelligence-platform/application/messages';
import { GqlExecutiveIntelligencePlatformEngine } from './gql.types';

@Resolver()
export class ExecutiveIntelligencePlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlExecutiveIntelligencePlatformEngine, { name: 'executiveIntelligencePlatformEngine' })
  async executiveIntelligencePlatformEngine(): Promise<GqlExecutiveIntelligencePlatformEngine> {
    const catalog = await this.queries.execute(new GetExecutiveIntelligencePlatformEngineQuery());
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
