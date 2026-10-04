import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CorporateRiskPlatformModule } from '../corporate-risk-platform.module';
import { CORPORATE_RISK_PLATFORM_CATALOG_PORT } from './ports';
import { NestCorporateRiskPlatformCatalogAdapter } from './nest-corporate-risk-platform.adapter';
import { CORPORATE_RISK_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, CorporateRiskPlatformModule],
  providers: [
    NestCorporateRiskPlatformCatalogAdapter,
    { provide: CORPORATE_RISK_PLATFORM_CATALOG_PORT, useExisting: NestCorporateRiskPlatformCatalogAdapter },
    ...CORPORATE_RISK_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class CorporateRiskPlatformApplicationModule {}
