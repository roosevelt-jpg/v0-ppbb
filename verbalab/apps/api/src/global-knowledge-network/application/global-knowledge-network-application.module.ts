import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GlobalKnowledgeNetworkModule } from '../global-knowledge-network.module';
import { GetGlobalKnowledgeNetworkEngineHandler, ListGlobalKnowledgeNetworkProductsHandler } from './handlers';
import { NestGlobalKnowledgeNetworkAdapter } from './nest-global-knowledge-network.adapter';

@Module({
  imports: [CqrsModule, GlobalKnowledgeNetworkModule],
  providers: [GetGlobalKnowledgeNetworkEngineHandler, ListGlobalKnowledgeNetworkProductsHandler, NestGlobalKnowledgeNetworkAdapter],
  exports: [NestGlobalKnowledgeNetworkAdapter],
})
export class GlobalKnowledgeNetworkApplicationModule {}
