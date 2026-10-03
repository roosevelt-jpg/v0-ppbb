import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAiCommercePlatformEngineQuery } from '../ai-commerce-platform/application/messages';
import { GqlAiCommercePlatformEngine } from './gql.types';

@Resolver()
export class AiCommercePlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlAiCommercePlatformEngine, { name: 'aiCommercePlatformEngine' })
  async aiCommercePlatformEngine(): Promise<GqlAiCommercePlatformEngine> {
    const catalog = await this.queries.execute(new GetAiCommercePlatformEngineQuery());
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
