import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetEnterpriseNationPlatformEngineQuery } from '../enterprise-nation-platform/application/messages';
import { GqlEnterpriseNationPlatformEngine } from './gql.types';

@Resolver()
export class EnterpriseNationPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlEnterpriseNationPlatformEngine, { name: 'enterpriseNationPlatformEngine' })
  async enterpriseNationPlatformEngine(): Promise<GqlEnterpriseNationPlatformEngine> {
    const catalog = await this.queries.execute(new GetEnterpriseNationPlatformEngineQuery());
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
