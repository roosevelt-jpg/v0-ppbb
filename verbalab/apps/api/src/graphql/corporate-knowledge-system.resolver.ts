import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetCorporateKnowledgeSystemEngineQuery } from '../corporate-knowledge-system/application/messages';
import { GqlCorporateKnowledgeSystemEngine } from './gql.types';

@Resolver()
export class CorporateKnowledgeSystemGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlCorporateKnowledgeSystemEngine, { name: 'corporateKnowledgeSystemEngine' })
  async corporateKnowledgeSystemEngine(): Promise<GqlCorporateKnowledgeSystemEngine> {
    const catalog = await this.queries.execute(new GetCorporateKnowledgeSystemEngineQuery());
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
