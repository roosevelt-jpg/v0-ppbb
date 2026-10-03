import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetSmartCityPlatformEngineQuery } from '../smart-city-platform/application/messages';
import { GqlSmartCityPlatformEngine } from './gql.types';

@Resolver()
export class SmartCityPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlSmartCityPlatformEngine, { name: 'smartCityPlatformEngine' })
  async smartCityPlatformEngine(): Promise<GqlSmartCityPlatformEngine> {
    const catalog = await this.queries.execute(new GetSmartCityPlatformEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      demoPublicSectorPlatform: catalog.honesty.demoPublicSectorPlatform,
      runsNationalInfrastructure: catalog.honesty.runsNationalInfrastructure,
      productionGovernmentDeployment: catalog.honesty.productionGovernmentDeployment,
      productionCourtPoliceMilitary: catalog.honesty.productionCourtPoliceMilitary,
      productionEmergencyDispatch: catalog.honesty.productionEmergencyDispatch,
      productionCitizenIdentityAuth: catalog.honesty.productionCitizenIdentityAuth,
      civilizationInfrastructureOs: catalog.honesty.civilizationInfrastructureOs,
    };
  }
}
