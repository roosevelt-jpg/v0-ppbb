import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { StandardsAnalyticsModule } from '../standards-analytics.module';
import { STANDARDS_ANALYTICS_CATALOG_PORT } from './ports';
import { NestStandardsAnalyticsCatalogAdapter } from './nest-standards-analytics.adapter';
import { STANDARDS_ANALYTICS_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, StandardsAnalyticsModule],
  providers: [
    NestStandardsAnalyticsCatalogAdapter,
    { provide: STANDARDS_ANALYTICS_CATALOG_PORT, useExisting: NestStandardsAnalyticsCatalogAdapter },
    ...STANDARDS_ANALYTICS_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class StandardsAnalyticsApplicationModule {}
