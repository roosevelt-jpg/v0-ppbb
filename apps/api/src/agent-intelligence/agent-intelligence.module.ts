import { Module } from '@nestjs/common';
import { AgentIntelligenceController } from './agent-intelligence.controller';
import { AgentIntelligenceService } from './agent-intelligence.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentOperatingSystemModule } from '../agent-operating-system/agent-operating-system.module';

@Module({
  imports: [IdentityModule, PrismaModule, AgentOperatingSystemModule],
  controllers: [AgentIntelligenceController],
  providers: [AgentIntelligenceService],
  exports: [AgentIntelligenceService],
})
export class AgentIntelligenceModule {}
