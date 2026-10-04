import { Module } from '@nestjs/common';
import { VoiceRecorderPluginController } from './voice-recorder-plugin.controller';
import { VoiceRecorderPluginService } from './voice-recorder-plugin.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { SpeechRecognitionModule } from '../speech-recognition/speech-recognition.module';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule, SpeechRecognitionModule],
  controllers: [VoiceRecorderPluginController],
  providers: [VoiceRecorderPluginService],
  exports: [VoiceRecorderPluginService],
})
export class VoiceRecorderPluginModule {}
