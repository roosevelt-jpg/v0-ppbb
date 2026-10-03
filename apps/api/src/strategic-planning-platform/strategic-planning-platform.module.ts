import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VcosStoreModule } from '../vcos-store/vcos-store.module';
import { StrategicPlanningPlatformController } from './strategic-planning-platform.controller';
import { StrategicPlanningPlatformService } from './strategic-planning-platform.service';

@Module({
  imports: [IdentityModule, VcosStoreModule],
  controllers: [StrategicPlanningPlatformController],
  providers: [StrategicPlanningPlatformService],
  exports: [StrategicPlanningPlatformService],
})
export class StrategicPlanningPlatformModule {}
