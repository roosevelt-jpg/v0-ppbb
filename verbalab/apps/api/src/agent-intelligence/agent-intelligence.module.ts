import { Module } from '@nestjs/common';
import { AgentIntelligenceController } from './agent-intelligence.controller';
import { AgentIntelligenceService } from './agent-intelligence.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [IdentityModule, PrismaModule],
  controllers: [AgentIntelligenceController],
  providers: [AgentIntelligenceService],
  exports: [AgentIntelligenceService],
})
export class AgentIntelligenceModule {}
