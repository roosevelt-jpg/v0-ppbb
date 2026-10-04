import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetGlobalLanguagePreservationEngineQuery } from '../global-language-preservation/application/messages';
import { GqlGlobalLanguagePreservationEngine } from './gql.types';

@Resolver()
export class GlobalLanguagePreservationGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlGlobalLanguagePreservationEngine, { name: 'globalLanguagePreservationEngine' })
  async globalLanguagePreservationEngine(): Promise<GqlGlobalLanguagePreservationEngine> {
    const catalog = await this.queries.execute(new GetGlobalLanguagePreservationEngineQuery());
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
