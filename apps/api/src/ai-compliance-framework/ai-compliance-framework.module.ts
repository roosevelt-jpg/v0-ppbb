import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VgasStoreModule } from '../vgas-store/vgas-store.module';
import { AiComplianceFrameworkController } from './ai-compliance-framework.controller';
import { AiComplianceFrameworkService } from './ai-compliance-framework.service';

@Module({
  imports: [IdentityModule, VgasStoreModule],
  controllers: [AiComplianceFrameworkController],
  providers: [AiComplianceFrameworkService],
  exports: [AiComplianceFrameworkService],
})
export class AiComplianceFrameworkModule {}
