import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GlobalAiFederationModule } from '../global-ai-federation.module';
import { GetGlobalAiFederationEngineHandler, ListGlobalAiFederationProductsHandler } from './handlers';
import { NestGlobalAiFederationAdapter } from './nest-global-ai-federation.adapter';

@Module({
  imports: [CqrsModule, GlobalAiFederationModule],
  providers: [GetGlobalAiFederationEngineHandler, ListGlobalAiFederationProductsHandler, NestGlobalAiFederationAdapter],
  exports: [NestGlobalAiFederationAdapter],
})
export class GlobalAiFederationApplicationModule {}
