import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { DcivStoreModule } from '../dciv-store/dciv-store.module';
import { GlobalKnowledgeNetworkController } from './global-knowledge-network.controller';
import { GlobalKnowledgeNetworkService } from './global-knowledge-network.service';

@Module({
  imports: [IdentityModule, DcivStoreModule],
  controllers: [GlobalKnowledgeNetworkController],
  providers: [GlobalKnowledgeNetworkService],
  exports: [GlobalKnowledgeNetworkService],
})
export class GlobalKnowledgeNetworkModule {}
