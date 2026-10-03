import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetLibraryReferenceEngineQuery } from '../library-reference/application/messages';
import { GqlLibraryReferenceEngine } from './gql.types';

@Resolver()
export class LibraryReferenceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlLibraryReferenceEngine, { name: 'libraryReferenceEngine' })
  async libraryReferenceEngine(): Promise<GqlLibraryReferenceEngine> {
    const catalog = await this.queries.execute(new GetLibraryReferenceEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      libraryIndexOnly: catalog.honesty.libraryIndexOnly,
      executableRoadmapCompleteThroughPhase260: catalog.honesty.executableRoadmapCompleteThroughPhase260,
      aiInternetExecutablePhases: catalog.honesty.aiInternetExecutablePhases,
      missionControlOs: catalog.honesty.missionControlOs,
      visionMarkedDoneWithoutSpec: catalog.honesty.visionMarkedDoneWithoutSpec,
    };
  }
}
