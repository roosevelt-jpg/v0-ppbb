import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetReferenceArchitecturesEngineQuery } from '../reference-architectures/application/messages';
import { GqlReferenceArchitecturesEngine } from './gql.types';

@Resolver()
export class ReferenceArchitecturesGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlReferenceArchitecturesEngine, { name: 'referenceArchitecturesEngine' })
  async referenceArchitecturesEngine(): Promise<GqlReferenceArchitecturesEngine> {
    const catalog = await this.queries.execute(new GetReferenceArchitecturesEngineQuery());
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
