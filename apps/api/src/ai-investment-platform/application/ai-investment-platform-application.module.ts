import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiInvestmentPlatformModule } from '../ai-investment-platform.module';
import { GetAiInvestmentPlatformEngineHandler, ListAiInvestmentPlatformProductsHandler } from './handlers';
import { NestAiInvestmentPlatformAdapter } from './nest-ai-investment-platform.adapter';

@Module({
  imports: [CqrsModule, AiInvestmentPlatformModule],
  providers: [GetAiInvestmentPlatformEngineHandler, ListAiInvestmentPlatformProductsHandler, NestAiInvestmentPlatformAdapter],
  exports: [NestAiInvestmentPlatformAdapter],
})
export class AiInvestmentPlatformApplicationModule {}
