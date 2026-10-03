import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UniversalTranslationGridModule } from '../universal-translation-grid.module';
import { GetUniversalTranslationGridEngineHandler, ListUniversalTranslationGridProductsHandler } from './handlers';
import { NestUniversalTranslationGridAdapter } from './nest-universal-translation-grid.adapter';

@Module({
  imports: [CqrsModule, UniversalTranslationGridModule],
  providers: [GetUniversalTranslationGridEngineHandler, ListUniversalTranslationGridProductsHandler, NestUniversalTranslationGridAdapter],
  exports: [NestUniversalTranslationGridAdapter],
})
export class UniversalTranslationGridApplicationModule {}
