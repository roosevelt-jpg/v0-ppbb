import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetEnterpriseArchitectureRepositoryEngineQuery } from '../enterprise-architecture-repository/application/messages';
import { GqlEnterpriseArchitectureRepositoryEngine } from './gql.types';

@Resolver()
export class EnterpriseArchitectureRepositoryGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlEnterpriseArchitectureRepositoryEngine, { name: 'enterpriseArchitectureRepositoryEngine' })
  async enterpriseArchitectureRepositoryEngine(): Promise<GqlEnterpriseArchitectureRepositoryEngine> {
    const catalog = await this.queries.execute(new GetEnterpriseArchitectureRepositoryEngineQuery());
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
