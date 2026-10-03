import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetStrategicPlanningPlatformEngineQuery } from '../strategic-planning-platform/application/messages';
import { GqlStrategicPlanningPlatformEngine } from './gql.types';

@Resolver()
export class StrategicPlanningPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlStrategicPlanningPlatformEngine, { name: 'strategicPlanningPlatformEngine' })
  async strategicPlanningPlatformEngine(): Promise<GqlStrategicPlanningPlatformEngine> {
    const catalog = await this.queries.execute(new GetStrategicPlanningPlatformEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      internalBusinessSoftware: catalog.honesty.internalBusinessSoftware,
      realCorporateGovernance: catalog.honesty.realCorporateGovernance,
      boardOs: catalog.honesty.boardOs,
      legalCounselOs: catalog.honesty.legalCounselOs,
    };
  }
}
