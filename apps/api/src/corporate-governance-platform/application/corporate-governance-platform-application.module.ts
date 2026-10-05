import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CorporateGovernancePlatformModule } from '../corporate-governance-platform.module';
import { CORPORATE_GOVERNANCE_PLATFORM_CATALOG_PORT } from './ports';
import { NestCorporateGovernancePlatformCatalogAdapter } from './nest-corporate-governance-platform.adapter';
import { CORPORATE_GOVERNANCE_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, CorporateGovernancePlatformModule],
  providers: [
    NestCorporateGovernancePlatformCatalogAdapter,
    { provide: CORPORATE_GOVERNANCE_PLATFORM_CATALOG_PORT, useExisting: NestCorporateGovernancePlatformCatalogAdapter },
    ...CORPORATE_GOVERNANCE_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class CorporateGovernancePlatformApplicationModule {}
