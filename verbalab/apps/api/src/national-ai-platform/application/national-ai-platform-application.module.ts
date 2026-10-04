import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { NationalAiPlatformModule } from '../national-ai-platform.module';
import { GetNationalAiPlatformEngineHandler, ListNationalAiPlatformProductsHandler } from './handlers';
import { NestNationalAiPlatformAdapter } from './nest-national-ai-platform.adapter';

@Module({
  imports: [CqrsModule, NationalAiPlatformModule],
  providers: [GetNationalAiPlatformEngineHandler, ListNationalAiPlatformProductsHandler, NestNationalAiPlatformAdapter],
  exports: [NestNationalAiPlatformAdapter],
})
export class NationalAiPlatformApplicationModule {}
