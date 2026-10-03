import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GlobalCommunityPlatformModule } from '../global-community-platform.module';
import { GetGlobalCommunityPlatformEngineHandler, ListGlobalCommunityPlatformProductsHandler } from './handlers';
import { NestGlobalCommunityPlatformAdapter } from './nest-global-community-platform.adapter';

@Module({
  imports: [CqrsModule, GlobalCommunityPlatformModule],
  providers: [GetGlobalCommunityPlatformEngineHandler, ListGlobalCommunityPlatformProductsHandler, NestGlobalCommunityPlatformAdapter],
  exports: [NestGlobalCommunityPlatformAdapter],
})
export class GlobalCommunityPlatformApplicationModule {}
