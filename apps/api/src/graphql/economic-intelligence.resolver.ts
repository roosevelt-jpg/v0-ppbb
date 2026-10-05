import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetEconomicIntelligenceEngineQuery } from '../economic-intelligence/application/messages';
import { GqlEconomicIntelligenceEngine } from './gql.types';

@Resolver()
export class EconomicIntelligenceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlEconomicIntelligenceEngine, { name: 'economicIntelligenceEngine' })
  async economicIntelligenceEngine(): Promise<GqlEconomicIntelligenceEngine> {
    const catalog = await this.queries.execute(new GetEconomicIntelligenceEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      internalMarketplaceSoftware: catalog.honesty.internalMarketplaceSoftware,
      worldsLargestAiEconomy: catalog.honesty.worldsLargestAiEconomy,
      handRolledCardHandling: catalog.honesty.handRolledCardHandling,
      autonomousPayouts: catalog.honesty.autonomousPayouts,
      fundingPortalOs: catalog.honesty.fundingPortalOs,
      securitiesOfferingOs: catalog.honesty.securitiesOfferingOs,
      investmentDashboardOnly: catalog.honesty.investmentDashboardOnly,
    };
  }
}
