import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { StandardsRepositoryModule } from '../standards-repository.module';
import { STANDARDS_REPOSITORY_CATALOG_PORT } from './ports';
import { NestStandardsRepositoryCatalogAdapter } from './nest-standards-repository.adapter';
import { STANDARDS_REPOSITORY_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, StandardsRepositoryModule],
  providers: [
    NestStandardsRepositoryCatalogAdapter,
    { provide: STANDARDS_REPOSITORY_CATALOG_PORT, useExisting: NestStandardsRepositoryCatalogAdapter },
    ...STANDARDS_REPOSITORY_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class StandardsRepositoryApplicationModule {}
