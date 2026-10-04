import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetGlobalKnowledgeNetworkEngineQuery } from '../global-knowledge-network/application/messages';
import { GqlGlobalKnowledgeNetworkEngine } from './gql.types';

@Resolver()
export class GlobalKnowledgeNetworkGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlGlobalKnowledgeNetworkEngine, { name: 'globalKnowledgeNetworkEngine' })
  async globalKnowledgeNetworkEngine(): Promise<GqlGlobalKnowledgeNetworkEngine> {
    const catalog = await this.queries.execute(new GetGlobalKnowledgeNetworkEngineQuery());
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
