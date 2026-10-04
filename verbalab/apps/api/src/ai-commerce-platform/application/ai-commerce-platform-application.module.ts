import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiCommercePlatformModule } from '../ai-commerce-platform.module';
import { GetAiCommercePlatformEngineHandler, ListAiCommercePlatformProductsHandler } from './handlers';
import { NestAiCommercePlatformAdapter } from './nest-ai-commerce-platform.adapter';

@Module({
  imports: [CqrsModule, AiCommercePlatformModule],
  providers: [GetAiCommercePlatformEngineHandler, ListAiCommercePlatformProductsHandler, NestAiCommercePlatformAdapter],
  exports: [NestAiCommercePlatformAdapter],
})
export class AiCommercePlatformApplicationModule {}
