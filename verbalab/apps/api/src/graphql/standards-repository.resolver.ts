import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetStandardsRepositoryEngineQuery } from '../standards-repository/application/messages';
import { GqlStandardsRepositoryEngine } from './gql.types';

@Resolver()
export class StandardsRepositoryGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlStandardsRepositoryEngine, { name: 'standardsRepositoryEngine' })
  async standardsRepositoryEngine(): Promise<GqlStandardsRepositoryEngine> {
    const catalog = await this.queries.execute(new GetStandardsRepositoryEngineQuery());
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
