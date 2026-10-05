import { Module } from '@nestjs/common';
import { MeetingTranscriptionController } from './meeting-transcription.controller';
import { MeetingTranscriptionService } from './meeting-transcription.service';
import { SpeechRecognitionModule } from '../speech-recognition/speech-recognition.module';
import { TranslateModule } from '../translate/translate.module';
import { AudioModule } from '../audio/audio.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    SpeechRecognitionModule,
    TranslateModule,
    AudioModule,
    PrismaModule,
    AuditCoreModule,
    ApiKeysModule,
    IdentityModule,
    RateLimitModule,
  ],
  controllers: [MeetingTranscriptionController],
  providers: [MeetingTranscriptionService, TranslateAuthGuard],
  exports: [MeetingTranscriptionService],
})
export class MeetingTranscriptionModule {}