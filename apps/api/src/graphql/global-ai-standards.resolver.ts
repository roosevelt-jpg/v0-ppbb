import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetGlobalAiStandardsEngineQuery } from '../global-ai-standards/application/messages';
import { GqlGlobalAiStandardsEngine } from './gql.types';

@Resolver()
export class GlobalAiStandardsGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlGlobalAiStandardsEngine, { name: 'globalAiStandardsEngine' })
  async globalAiStandardsEngine(): Promise<GqlGlobalAiStandardsEngine> {
    const catalog = await this.queries.execute(new GetGlobalAiStandardsEngineQuery());
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
