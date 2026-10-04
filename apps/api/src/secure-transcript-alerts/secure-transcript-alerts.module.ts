import { Module } from '@nestjs/common';
import { SecureTranscriptAlertsController } from './secure-transcript-alerts.controller';
import { SecureTranscriptAlertsService } from './secure-transcript-alerts.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { SpeechRecognitionModule } from '../speech-recognition/speech-recognition.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
    SpeechRecognitionModule,
    NotificationsModule,
    ApiKeysModule,
    RateLimitModule,
  ],
  controllers: [SecureTranscriptAlertsController],
  providers: [SecureTranscriptAlertsService, TranslateAuthGuard],
  exports: [SecureTranscriptAlertsService],
})
export class SecureTranscriptAlertsModule {}
