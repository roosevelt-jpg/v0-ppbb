import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetRevenueSharingPlatformEngineQuery } from '../revenue-sharing-platform/application/messages';
import { GqlRevenueSharingPlatformEngine } from './gql.types';

@Resolver()
export class RevenueSharingPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlRevenueSharingPlatformEngine, { name: 'revenueSharingPlatformEngine' })
  async revenueSharingPlatformEngine(): Promise<GqlRevenueSharingPlatformEngine> {
    const catalog = await this.queries.execute(new GetRevenueSharingPlatformEngineQuery());
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
