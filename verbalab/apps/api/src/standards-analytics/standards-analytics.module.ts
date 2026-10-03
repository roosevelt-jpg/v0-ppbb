import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VgasStoreModule } from '../vgas-store/vgas-store.module';
import { StandardsAnalyticsController } from './standards-analytics.controller';
import { StandardsAnalyticsService } from './standards-analytics.service';

@Module({
  imports: [IdentityModule, VgasStoreModule],
  controllers: [StandardsAnalyticsController],
  providers: [StandardsAnalyticsService],
  exports: [StandardsAnalyticsService],
})
export class StandardsAnalyticsModule {}
