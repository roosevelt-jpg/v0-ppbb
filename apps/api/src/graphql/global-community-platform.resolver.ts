import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetGlobalCommunityPlatformEngineQuery } from '../global-community-platform/application/messages';
import { GqlGlobalCommunityPlatformEngine } from './gql.types';

@Resolver()
export class GlobalCommunityPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlGlobalCommunityPlatformEngine, { name: 'globalCommunityPlatformEngine' })
  async globalCommunityPlatformEngine(): Promise<GqlGlobalCommunityPlatformEngine> {
    const catalog = await this.queries.execute(new GetGlobalCommunityPlatformEngineQuery());
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
