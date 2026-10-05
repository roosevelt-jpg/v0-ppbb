import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAiEconomyEngineQuery } from '../ai-economy/application/messages';
import { GqlAiEconomyEngine } from './gql.types';

@Resolver()
export class AiEconomyGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlAiEconomyEngine, { name: 'aiEconomyEngine' })
  async aiEconomyEngine(): Promise<GqlAiEconomyEngine> {
    const catalog = await this.queries.execute(new GetAiEconomyEngineQuery());
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
