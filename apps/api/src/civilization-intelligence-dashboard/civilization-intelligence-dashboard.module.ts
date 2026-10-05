import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { DcivStoreModule } from '../dciv-store/dciv-store.module';
import { CivilizationIntelligenceDashboardController } from './civilization-intelligence-dashboard.controller';
import { CivilizationIntelligenceDashboardService } from './civilization-intelligence-dashboard.service';

@Module({
  imports: [IdentityModule, DcivStoreModule],
  controllers: [CivilizationIntelligenceDashboardController],
  providers: [CivilizationIntelligenceDashboardService],
  exports: [CivilizationIntelligenceDashboardService],
})
export class CivilizationIntelligenceDashboardModule {}
