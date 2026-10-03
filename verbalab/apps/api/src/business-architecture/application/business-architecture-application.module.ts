import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BusinessArchitectureModule } from '../business-architecture.module';
import { BUSINESS_ARCHITECTURE_CATALOG_PORT } from './ports';
import { NestBusinessArchitectureCatalogAdapter } from './nest-business-architecture.adapter';
import { BUSINESS_ARCHITECTURE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, BusinessArchitectureModule],
  providers: [
    NestBusinessArchitectureCatalogAdapter,
    { provide: BUSINESS_ARCHITECTURE_CATALOG_PORT, useExisting: NestBusinessArchitectureCatalogAdapter },
    ...BUSINESS_ARCHITECTURE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class BusinessArchitectureApplicationModule {}
