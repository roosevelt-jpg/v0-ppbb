import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAiCertificationPlatformEngineQuery } from '../ai-certification-platform/application/messages';
import { GqlAiCertificationPlatformEngine } from './gql.types';

@Resolver()
export class AiCertificationPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlAiCertificationPlatformEngine, { name: 'aiCertificationPlatformEngine' })
  async aiCertificationPlatformEngine(): Promise<GqlAiCertificationPlatformEngine> {
    const catalog = await this.queries.execute(new GetAiCertificationPlatformEngineQuery());
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
