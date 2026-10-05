import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetGlobalAiFederationEngineQuery } from '../global-ai-federation/application/messages';
import { GqlGlobalAiFederationEngine } from './gql.types';

@Resolver()
export class GlobalAiFederationGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlGlobalAiFederationEngine, { name: 'globalAiFederationEngine' })
  async globalAiFederationEngine(): Promise<GqlGlobalAiFederationEngine> {
    const catalog = await this.queries.execute(new GetGlobalAiFederationEngineQuery());
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
