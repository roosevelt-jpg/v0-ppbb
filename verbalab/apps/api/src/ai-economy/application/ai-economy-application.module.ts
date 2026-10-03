import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiEconomyModule } from '../ai-economy.module';
import { GetAiEconomyEngineHandler, ListAiEconomyProductsHandler } from './handlers';
import { NestAiEconomyAdapter } from './nest-ai-economy.adapter';

@Module({
  imports: [CqrsModule, AiEconomyModule],
  providers: [GetAiEconomyEngineHandler, ListAiEconomyProductsHandler, NestAiEconomyAdapter],
  exports: [NestAiEconomyAdapter],
})
export class AiEconomyApplicationModule {}
