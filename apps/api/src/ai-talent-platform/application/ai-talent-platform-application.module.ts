import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiTalentPlatformModule } from '../ai-talent-platform.module';
import { GetAiTalentPlatformEngineHandler, ListAiTalentPlatformProductsHandler } from './handlers';
import { NestAiTalentPlatformAdapter } from './nest-ai-talent-platform.adapter';

@Module({
  imports: [CqrsModule, AiTalentPlatformModule],
  providers: [GetAiTalentPlatformEngineHandler, ListAiTalentPlatformProductsHandler, NestAiTalentPlatformAdapter],
  exports: [NestAiTalentPlatformAdapter],
})
export class AiTalentPlatformApplicationModule {}
