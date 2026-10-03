import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAiLicensingPlatformEngineQuery } from '../ai-licensing-platform/application/messages';
import { GqlAiLicensingPlatformEngine } from './gql.types';

@Resolver()
export class AiLicensingPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlAiLicensingPlatformEngine, { name: 'aiLicensingPlatformEngine' })
  async aiLicensingPlatformEngine(): Promise<GqlAiLicensingPlatformEngine> {
    const catalog = await this.queries.execute(new GetAiLicensingPlatformEngineQuery());
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
