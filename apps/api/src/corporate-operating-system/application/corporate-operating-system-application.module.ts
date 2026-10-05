import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CorporateOperatingSystemModule } from '../corporate-operating-system.module';
import { CORPORATE_OPERATING_SYSTEM_CATALOG_PORT } from './ports';
import { NestCorporateOperatingSystemCatalogAdapter } from './nest-corporate-operating-system.adapter';
import { CORPORATE_OPERATING_SYSTEM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, CorporateOperatingSystemModule],
  providers: [
    NestCorporateOperatingSystemCatalogAdapter,
    { provide: CORPORATE_OPERATING_SYSTEM_CATALOG_PORT, useExisting: NestCorporateOperatingSystemCatalogAdapter },
    ...CORPORATE_OPERATING_SYSTEM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class CorporateOperatingSystemApplicationModule {}
