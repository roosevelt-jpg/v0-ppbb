import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetEnterpriseAssessmentPlatformEngineQuery } from '../enterprise-assessment-platform/application/messages';
import { GqlEnterpriseAssessmentPlatformEngine } from './gql.types';

@Resolver()
export class EnterpriseAssessmentPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlEnterpriseAssessmentPlatformEngine, { name: 'enterpriseAssessmentPlatformEngine' })
  async enterpriseAssessmentPlatformEngine(): Promise<GqlEnterpriseAssessmentPlatformEngine> {
    const catalog = await this.queries.execute(new GetEnterpriseAssessmentPlatformEngineQuery());
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
