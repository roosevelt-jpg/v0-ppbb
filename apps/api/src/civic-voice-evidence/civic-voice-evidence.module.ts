
import { Module } from '@nestjs/common';
import { CivicVoiceEvidenceController } from './civic-voice-evidence.controller';
import { CivicVoiceEvidenceService } from './civic-voice-evidence.service';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, AuditCoreModule],
  controllers: [CivicVoiceEvidenceController],
  providers: [CivicVoiceEvidenceService],
  exports: [CivicVoiceEvidenceService],
})
export class CivicVoiceEvidenceModule {}
