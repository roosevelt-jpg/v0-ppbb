import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetNationalAiPlatformEngineQuery } from '../national-ai-platform/application/messages';
import { GqlNationalAiPlatformEngine } from './gql.types';

@Resolver()
export class NationalAiPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlNationalAiPlatformEngine, { name: 'nationalAiPlatformEngine' })
  async nationalAiPlatformEngine(): Promise<GqlNationalAiPlatformEngine> {
    const catalog = await this.queries.execute(new GetNationalAiPlatformEngineQuery());
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
