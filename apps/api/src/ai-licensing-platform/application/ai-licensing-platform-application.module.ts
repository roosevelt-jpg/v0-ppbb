import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiLicensingPlatformModule } from '../ai-licensing-platform.module';
import { GetAiLicensingPlatformEngineHandler, ListAiLicensingPlatformProductsHandler } from './handlers';
import { NestAiLicensingPlatformAdapter } from './nest-ai-licensing-platform.adapter';

@Module({
  imports: [CqrsModule, AiLicensingPlatformModule],
  providers: [GetAiLicensingPlatformEngineHandler, ListAiLicensingPlatformProductsHandler, NestAiLicensingPlatformAdapter],
  exports: [NestAiLicensingPlatformAdapter],
})
export class AiLicensingPlatformApplicationModule {}
