import { Injectable } from '@nestjs/common';
import { AiTalentPlatformService } from '../ai-talent-platform.service';
import { AiTalentPlatformEnginePort } from './ports';

@Injectable()
export class NestAiTalentPlatformAdapter implements AiTalentPlatformEnginePort {
  constructor(private readonly service: AiTalentPlatformService) {}
  engine() {
    return this.service.engine();
  }
}
