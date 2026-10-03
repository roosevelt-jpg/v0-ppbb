import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LibraryReferenceModule } from '../library-reference.module';
import { GetLibraryReferenceEngineHandler, ListLibraryReferenceProductsHandler } from './handlers';
import { NestLibraryReferenceAdapter } from './nest-library-reference.adapter';

@Module({
  imports: [CqrsModule, LibraryReferenceModule],
  providers: [GetLibraryReferenceEngineHandler, ListLibraryReferenceProductsHandler, NestLibraryReferenceAdapter],
  exports: [NestLibraryReferenceAdapter],
})
export class LibraryReferenceApplicationModule {}
