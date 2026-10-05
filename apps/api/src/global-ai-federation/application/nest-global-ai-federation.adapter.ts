import { Injectable } from '@nestjs/common';
import { GlobalAiFederationService } from '../global-ai-federation.service';
import { GlobalAiFederationEnginePort } from './ports';

@Injectable()
export class NestGlobalAiFederationAdapter implements GlobalAiFederationEnginePort {
  constructor(private readonly service: GlobalAiFederationService) {}
  engine() { return this.service.engine(); }
}
