import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetStandardsAnalyticsEngineQuery } from '../standards-analytics/application/messages';
import { GqlStandardsAnalyticsEngine } from './gql.types';

@Resolver()
export class StandardsAnalyticsGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlStandardsAnalyticsEngine, { name: 'standardsAnalyticsEngine' })
  async standardsAnalyticsEngine(): Promise<GqlStandardsAnalyticsEngine> {
    const catalog = await this.queries.execute(new GetStandardsAnalyticsEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      internalStandardsPlatform: catalog.honesty.internalStandardsPlatform,
      internationalStandardAdoption: catalog.honesty.internationalStandardAdoption,
      isoIeeeW3cRecognition: catalog.honesty.isoIeeeW3cRecognition,
      thirdPartyAccreditation: catalog.honesty.thirdPartyAccreditation,
    };
  }
}
