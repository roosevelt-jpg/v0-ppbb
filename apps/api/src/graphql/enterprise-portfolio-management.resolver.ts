import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetEnterprisePortfolioManagementEngineQuery } from '../enterprise-portfolio-management/application/messages';
import { GqlEnterprisePortfolioManagementEngine } from './gql.types';

@Resolver()
export class EnterprisePortfolioManagementGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlEnterprisePortfolioManagementEngine, { name: 'enterprisePortfolioManagementEngine' })
  async enterprisePortfolioManagementEngine(): Promise<GqlEnterprisePortfolioManagementEngine> {
    const catalog = await this.queries.execute(new GetEnterprisePortfolioManagementEngineQuery());
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
