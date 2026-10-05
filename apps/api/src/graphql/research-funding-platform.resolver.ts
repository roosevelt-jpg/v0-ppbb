import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetResearchFundingPlatformEngineQuery } from '../research-funding-platform/application/messages';
import { GqlResearchFundingPlatformEngine } from './gql.types';

@Resolver()
export class ResearchFundingPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlResearchFundingPlatformEngine, { name: 'researchFundingPlatformEngine' })
  async researchFundingPlatformEngine(): Promise<GqlResearchFundingPlatformEngine> {
    const catalog = await this.queries.execute(new GetResearchFundingPlatformEngineQuery());
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
