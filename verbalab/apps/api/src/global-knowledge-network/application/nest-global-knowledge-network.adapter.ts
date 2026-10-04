import { Injectable } from '@nestjs/common';
import { GlobalKnowledgeNetworkService } from '../global-knowledge-network.service';
import { GlobalKnowledgeNetworkEnginePort } from './ports';

@Injectable()
export class NestGlobalKnowledgeNetworkAdapter implements GlobalKnowledgeNetworkEnginePort {
  constructor(private readonly service: GlobalKnowledgeNetworkService) {}
  engine() { return this.service.engine(); }
}
