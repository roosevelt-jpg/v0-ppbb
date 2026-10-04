import { Module } from '@nestjs/common';
import { AgentVoiceTrainingController } from './agent-voice-training.controller';
import { AgentVoiceTrainingService } from './agent-voice-training.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [AgentVoiceTrainingController],
  providers: [AgentVoiceTrainingService],
  exports: [AgentVoiceTrainingService],
})
export class AgentVoiceTrainingModule {}
