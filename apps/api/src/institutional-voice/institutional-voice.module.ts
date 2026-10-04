
import { Module } from '@nestjs/common';
import { InstitutionalVoiceController } from './institutional-voice.controller';
import { InstitutionalVoiceService } from './institutional-voice.service';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, AuditCoreModule],
  controllers: [InstitutionalVoiceController],
  providers: [InstitutionalVoiceService],
  exports: [InstitutionalVoiceService],
})
export class InstitutionalVoiceModule {}
