import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ResearchFundingPlatformModule } from '../research-funding-platform.module';
import { GetResearchFundingPlatformEngineHandler, ListResearchFundingPlatformProductsHandler } from './handlers';
import { NestResearchFundingPlatformAdapter } from './nest-research-funding-platform.adapter';

@Module({
  imports: [CqrsModule, ResearchFundingPlatformModule],
  providers: [GetResearchFundingPlatformEngineHandler, ListResearchFundingPlatformProductsHandler, NestResearchFundingPlatformAdapter],
  exports: [NestResearchFundingPlatformAdapter],
})
export class ResearchFundingPlatformApplicationModule {}
