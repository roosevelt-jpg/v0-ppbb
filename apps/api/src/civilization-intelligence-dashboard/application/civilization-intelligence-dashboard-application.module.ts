import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CivilizationIntelligenceDashboardModule } from '../civilization-intelligence-dashboard.module';
import { GetCivilizationIntelligenceDashboardEngineHandler, ListCivilizationIntelligenceDashboardProductsHandler } from './handlers';
import { NestCivilizationIntelligenceDashboardAdapter } from './nest-civilization-intelligence-dashboard.adapter';

@Module({
  imports: [CqrsModule, CivilizationIntelligenceDashboardModule],
  providers: [GetCivilizationIntelligenceDashboardEngineHandler, ListCivilizationIntelligenceDashboardProductsHandler, NestCivilizationIntelligenceDashboardAdapter],
  exports: [NestCivilizationIntelligenceDashboardAdapter],
})
export class CivilizationIntelligenceDashboardApplicationModule {}
