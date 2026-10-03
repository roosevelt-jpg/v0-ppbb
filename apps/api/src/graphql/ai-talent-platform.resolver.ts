import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAiTalentPlatformEngineQuery } from '../ai-talent-platform/application/messages';
import { GqlAiTalentPlatformEngine } from './gql.types';

@Resolver()
export class AiTalentPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlAiTalentPlatformEngine, { name: 'aiTalentPlatformEngine' })
  async aiTalentPlatformEngine(): Promise<GqlAiTalentPlatformEngine> {
    const catalog = await this.queries.execute(new GetAiTalentPlatformEngineQuery());
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
