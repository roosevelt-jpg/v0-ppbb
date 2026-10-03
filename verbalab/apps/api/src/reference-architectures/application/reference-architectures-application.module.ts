import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ReferenceArchitecturesModule } from '../reference-architectures.module';
import { REFERENCE_ARCHITECTURES_CATALOG_PORT } from './ports';
import { NestReferenceArchitecturesCatalogAdapter } from './nest-reference-architectures.adapter';
import { REFERENCE_ARCHITECTURES_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ReferenceArchitecturesModule],
  providers: [
    NestReferenceArchitecturesCatalogAdapter,
    { provide: REFERENCE_ARCHITECTURES_CATALOG_PORT, useExisting: NestReferenceArchitecturesCatalogAdapter },
    ...REFERENCE_ARCHITECTURES_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ReferenceArchitecturesApplicationModule {}
