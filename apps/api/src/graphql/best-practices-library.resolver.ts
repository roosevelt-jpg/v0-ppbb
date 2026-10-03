import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetBestPracticesLibraryEngineQuery } from '../best-practices-library/application/messages';
import { GqlBestPracticesLibraryEngine } from './gql.types';

@Resolver()
export class BestPracticesLibraryGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlBestPracticesLibraryEngine, { name: 'bestPracticesLibraryEngine' })
  async bestPracticesLibraryEngine(): Promise<GqlBestPracticesLibraryEngine> {
    const catalog = await this.queries.execute(new GetBestPracticesLibraryEngineQuery());
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
