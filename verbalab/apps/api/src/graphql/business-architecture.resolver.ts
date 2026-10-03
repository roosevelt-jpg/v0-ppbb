import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetBusinessArchitectureEngineQuery } from '../business-architecture/application/messages';
import { GqlBusinessArchitectureEngine } from './gql.types';

@Resolver()
export class BusinessArchitectureGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlBusinessArchitectureEngine, { name: 'businessArchitectureEngine' })
  async businessArchitectureEngine(): Promise<GqlBusinessArchitectureEngine> {
    const catalog = await this.queries.execute(new GetBusinessArchitectureEngineQuery());
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
