import { Module } from '@nestjs/common';
import { VerbaVoiceController } from './verba-voice.controller';
import { VerbaVoiceService } from './verba-voice.service';
import { SpeechRecognitionModule } from '../speech-recognition/speech-recognition.module';
import { ChatModule } from '../chat/chat.module';
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
    ChatModule,
    AudioModule,
    PrismaModule,
    AuditCoreModule,
    ApiKeysModule,
    IdentityModule,
    RateLimitModule,
  ],
  controllers: [VerbaVoiceController],
  providers: [VerbaVoiceService, TranslateAuthGuard],
  exports: [VerbaVoiceService],
})
export class VerbaVoiceModule {}