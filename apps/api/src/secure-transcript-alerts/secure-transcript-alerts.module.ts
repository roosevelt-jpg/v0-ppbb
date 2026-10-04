import { Module } from '@nestjs/common';
import { SecureTranscriptAlertsController } from './secure-transcript-alerts.controller';
import { SecureTranscriptAlertsService } from './secure-transcript-alerts.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { SpeechRecognitionModule } from '../speech-recognition/speech-recognition.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
    SpeechRecognitionModule,
    NotificationsModule,
  ],
  controllers: [SecureTranscriptAlertsController],
  providers: [SecureTranscriptAlertsService],
  exports: [SecureTranscriptAlertsService],
})
export class SecureTranscriptAlertsModule {}
