import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetDigitalCivilizationEngineQuery } from '../digital-civilization/application/messages';
import { GqlDigitalCivilizationEngine } from './gql.types';

@Resolver()
export class DigitalCivilizationGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlDigitalCivilizationEngine, { name: 'digitalCivilizationEngine' })
  async digitalCivilizationEngine(): Promise<GqlDigitalCivilizationEngine> {
    const catalog = await this.queries.execute(new GetDigitalCivilizationEngineQuery());
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
