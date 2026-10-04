import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAiComplianceFrameworkEngineQuery } from '../ai-compliance-framework/application/messages';
import { GqlAiComplianceFrameworkEngine } from './gql.types';

@Resolver()
export class AiComplianceFrameworkGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlAiComplianceFrameworkEngine, { name: 'aiComplianceFrameworkEngine' })
  async aiComplianceFrameworkEngine(): Promise<GqlAiComplianceFrameworkEngine> {
    const catalog = await this.queries.execute(new GetAiComplianceFrameworkEngineQuery());
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
