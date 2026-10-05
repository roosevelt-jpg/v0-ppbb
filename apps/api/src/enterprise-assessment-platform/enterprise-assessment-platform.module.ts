import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VgasStoreModule } from '../vgas-store/vgas-store.module';
import { EnterpriseAssessmentPlatformController } from './enterprise-assessment-platform.controller';
import { EnterpriseAssessmentPlatformService } from './enterprise-assessment-platform.service';

@Module({
  imports: [IdentityModule, VgasStoreModule],
  controllers: [EnterpriseAssessmentPlatformController],
  providers: [EnterpriseAssessmentPlatformService],
  exports: [EnterpriseAssessmentPlatformService],
})
export class EnterpriseAssessmentPlatformModule {}
