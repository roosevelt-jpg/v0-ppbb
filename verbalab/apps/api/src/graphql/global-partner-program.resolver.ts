import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetGlobalPartnerProgramEngineQuery } from '../global-partner-program/application/messages';
import { GqlGlobalPartnerProgramEngine } from './gql.types';

@Resolver()
export class GlobalPartnerProgramGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlGlobalPartnerProgramEngine, { name: 'globalPartnerProgramEngine' })
  async globalPartnerProgramEngine(): Promise<GqlGlobalPartnerProgramEngine> {
    const catalog = await this.queries.execute(new GetGlobalPartnerProgramEngineQuery());
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
