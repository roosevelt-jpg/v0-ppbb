import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetUniversalTranslationGridEngineQuery } from '../universal-translation-grid/application/messages';
import { GqlUniversalTranslationGridEngine } from './gql.types';

@Resolver()
export class UniversalTranslationGridGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlUniversalTranslationGridEngine, { name: 'universalTranslationGridEngine' })
  async universalTranslationGridEngine(): Promise<GqlUniversalTranslationGridEngine> {
    const catalog = await this.queries.execute(new GetUniversalTranslationGridEngineQuery());
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
