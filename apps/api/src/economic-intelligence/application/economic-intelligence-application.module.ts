import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EconomicIntelligenceModule } from '../economic-intelligence.module';
import { GetEconomicIntelligenceEngineHandler, ListEconomicIntelligenceProductsHandler } from './handlers';
import { NestEconomicIntelligenceAdapter } from './nest-economic-intelligence.adapter';

@Module({
  imports: [CqrsModule, EconomicIntelligenceModule],
  providers: [GetEconomicIntelligenceEngineHandler, ListEconomicIntelligenceProductsHandler, NestEconomicIntelligenceAdapter],
  exports: [NestEconomicIntelligenceAdapter],
})
export class EconomicIntelligenceApplicationModule {}
