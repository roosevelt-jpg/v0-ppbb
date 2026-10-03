import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAiInvestmentPlatformEngineQuery } from '../ai-investment-platform/application/messages';
import { GqlAiInvestmentPlatformEngine } from './gql.types';

@Resolver()
export class AiInvestmentPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlAiInvestmentPlatformEngine, { name: 'aiInvestmentPlatformEngine' })
  async aiInvestmentPlatformEngine(): Promise<GqlAiInvestmentPlatformEngine> {
    const catalog = await this.queries.execute(new GetAiInvestmentPlatformEngineQuery());
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
