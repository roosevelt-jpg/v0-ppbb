import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetCivilizationIntelligenceDashboardEngineQuery } from '../civilization-intelligence-dashboard/application/messages';
import { GqlCivilizationIntelligenceDashboardEngine } from './gql.types';

@Resolver()
export class CivilizationIntelligenceDashboardGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlCivilizationIntelligenceDashboardEngine, { name: 'civilizationIntelligenceDashboardEngine' })
  async civilizationIntelligenceDashboardEngine(): Promise<GqlCivilizationIntelligenceDashboardEngine> {
    const catalog = await this.queries.execute(new GetCivilizationIntelligenceDashboardEngineQuery());
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
