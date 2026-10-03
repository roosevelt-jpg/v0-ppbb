import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BestPracticesLibraryModule } from '../best-practices-library.module';
import { BEST_PRACTICES_LIBRARY_CATALOG_PORT } from './ports';
import { NestBestPracticesLibraryCatalogAdapter } from './nest-best-practices-library.adapter';
import { BEST_PRACTICES_LIBRARY_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, BestPracticesLibraryModule],
  providers: [
    NestBestPracticesLibraryCatalogAdapter,
    { provide: BEST_PRACTICES_LIBRARY_CATALOG_PORT, useExisting: NestBestPracticesLibraryCatalogAdapter },
    ...BEST_PRACTICES_LIBRARY_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class BestPracticesLibraryApplicationModule {}
