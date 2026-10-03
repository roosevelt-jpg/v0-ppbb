import { Injectable } from '@nestjs/common';
import { AiCommercePlatformService } from '../ai-commerce-platform.service';
import { AiCommercePlatformEnginePort } from './ports';

@Injectable()
export class NestAiCommercePlatformAdapter implements AiCommercePlatformEnginePort {
  constructor(private readonly service: AiCommercePlatformService) {}
  engine() {
    return this.service.engine();
  }
}
