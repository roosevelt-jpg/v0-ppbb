import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { StrategicPlanningPlatformModule } from '../strategic-planning-platform.module';
import { STRATEGIC_PLANNING_PLATFORM_CATALOG_PORT } from './ports';
import { NestStrategicPlanningPlatformCatalogAdapter } from './nest-strategic-planning-platform.adapter';
import { STRATEGIC_PLANNING_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, StrategicPlanningPlatformModule],
  providers: [
    NestStrategicPlanningPlatformCatalogAdapter,
    { provide: STRATEGIC_PLANNING_PLATFORM_CATALOG_PORT, useExisting: NestStrategicPlanningPlatformCatalogAdapter },
    ...STRATEGIC_PLANNING_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class StrategicPlanningPlatformApplicationModule {}
