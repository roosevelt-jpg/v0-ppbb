import { Module } from '@nestjs/common';
import { AgentVoiceTrainingController } from './agent-voice-training.controller';
import { AgentVoiceTrainingService } from './agent-voice-training.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [PrismaModule, IdentityModule, AuditCoreModule, ApiKeysModule, RateLimitModule],
  controllers: [AgentVoiceTrainingController],
  providers: [AgentVoiceTrainingService, TranslateAuthGuard],
  exports: [AgentVoiceTrainingService],
})
export class AgentVoiceTrainingModule {}
