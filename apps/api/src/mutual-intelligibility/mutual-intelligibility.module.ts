
import { Module } from '@nestjs/common';
import { MutualIntelligibilityController } from './mutual-intelligibility.controller';
import { MutualIntelligibilityService } from './mutual-intelligibility.service';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, AuditCoreModule],
  controllers: [MutualIntelligibilityController],
  providers: [MutualIntelligibilityService],
  exports: [MutualIntelligibilityService],
})
export class MutualIntelligibilityModule {}
