import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetWorldLanguageRegistryEngineQuery } from '../world-language-registry/application/messages';
import { GqlWorldLanguageRegistryEngine } from './gql.types';

@Resolver()
export class WorldLanguageRegistryGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlWorldLanguageRegistryEngine, { name: 'worldLanguageRegistryEngine' })
  async worldLanguageRegistryEngine(): Promise<GqlWorldLanguageRegistryEngine> {
    const catalog = await this.queries.execute(new GetWorldLanguageRegistryEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      coverageComplete: catalog.honesty.coverageComplete,
    };
  }
}
