import { Module } from '@nestjs/common';
import { VoiceLawAuthenticityController } from './voice-law-authenticity.controller';
import { VoiceLawAuthenticityService } from './voice-law-authenticity.service';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AudioModule } from '../audio/audio.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { CivicVoiceSealModule } from '../civic-voice-seal/civic-voice-seal.module';
import { CivicVoiceEvidenceModule } from '../civic-voice-evidence/civic-voice-evidence.module';
import { SpeakerIntelligenceModule } from '../speaker-intelligence/speaker-intelligence.module';

@Module({
  imports: [
    IdentityModule,
    AuditCoreModule,
    ApiKeysModule,
    AudioModule,
    RateLimitModule,
    CivicVoiceSealModule,
    CivicVoiceEvidenceModule,
    SpeakerIntelligenceModule,
  ],
  controllers: [VoiceLawAuthenticityController],
  providers: [VoiceLawAuthenticityService, TranslateAuthGuard],
  exports: [VoiceLawAuthenticityService],
})
export class VoiceLawAuthenticityModule {}
