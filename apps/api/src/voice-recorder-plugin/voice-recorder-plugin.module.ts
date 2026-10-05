import { Module } from '@nestjs/common';
import { VoiceRecorderPluginController } from './voice-recorder-plugin.controller';
import { VoiceRecorderPluginService } from './voice-recorder-plugin.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { SpeechRecognitionModule } from '../speech-recognition/speech-recognition.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
    SpeechRecognitionModule,
    ApiKeysModule,
    RateLimitModule,
  ],
  controllers: [VoiceRecorderPluginController],
  providers: [VoiceRecorderPluginService, TranslateAuthGuard],
  exports: [VoiceRecorderPluginService],
})
export class VoiceRecorderPluginModule {}
