import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GlobalLanguagePreservationModule } from '../global-language-preservation.module';
import { GetGlobalLanguagePreservationEngineHandler, ListGlobalLanguagePreservationProductsHandler } from './handlers';
import { NestGlobalLanguagePreservationAdapter } from './nest-global-language-preservation.adapter';

@Module({
  imports: [CqrsModule, GlobalLanguagePreservationModule],
  providers: [GetGlobalLanguagePreservationEngineHandler, ListGlobalLanguagePreservationProductsHandler, NestGlobalLanguagePreservationAdapter],
  exports: [NestGlobalLanguagePreservationAdapter],
})
export class GlobalLanguagePreservationApplicationModule {}
