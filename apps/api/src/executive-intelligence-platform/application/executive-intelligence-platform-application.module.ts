import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ExecutiveIntelligencePlatformModule } from '../executive-intelligence-platform.module';
import { EXECUTIVE_INTELLIGENCE_PLATFORM_CATALOG_PORT } from './ports';
import { NestExecutiveIntelligencePlatformCatalogAdapter } from './nest-executive-intelligence-platform.adapter';
import { EXECUTIVE_INTELLIGENCE_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, ExecutiveIntelligencePlatformModule],
  providers: [
    NestExecutiveIntelligencePlatformCatalogAdapter,
    { provide: EXECUTIVE_INTELLIGENCE_PLATFORM_CATALOG_PORT, useExisting: NestExecutiveIntelligencePlatformCatalogAdapter },
    ...EXECUTIVE_INTELLIGENCE_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class ExecutiveIntelligencePlatformApplicationModule {}
