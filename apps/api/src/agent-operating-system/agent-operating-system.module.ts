import { Module } from '@nestjs/common';
import { AgentOperatingSystemController } from './agent-operating-system.controller';
import { AgentOsController } from './agent-os.controller';
import { AgentOperatingSystemService } from './agent-operating-system.service';
import { AgentRuntimeModule } from '../agent-runtime/agent-runtime.module';
import { AgentFabricModule } from '../agent-fabric/agent-fabric.module';
import { AgentMarketplaceModule } from '../agent-marketplace/agent-marketplace.module';
import { AiKernelModule } from '../ai-kernel/ai-kernel.module';
import { AiFabricModule } from '../ai-fabric/ai-fabric.module';
import { AiOrchestrationModule } from '../ai-orchestration/ai-orchestration.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [
    AgentRuntimeModule,
    AgentFabricModule,
    AgentMarketplaceModule,
    AiKernelModule,
    AiFabricModule,
    AiOrchestrationModule,
    IdentityModule,
  ],
  controllers: [AgentOperatingSystemController, AgentOsController],
  providers: [AgentOperatingSystemService],
  exports: [AgentOperatingSystemService],
})
export class AgentOperatingSystemModule {}
