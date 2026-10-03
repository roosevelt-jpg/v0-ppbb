import { Injectable } from '@nestjs/common';
import { NationalAiPlatformService } from '../national-ai-platform.service';
import { NationalAiPlatformEnginePort } from './ports';

@Injectable()
export class NestNationalAiPlatformAdapter implements NationalAiPlatformEnginePort {
  constructor(private readonly service: NationalAiPlatformService) {}
  engine() { return this.service.engine(); }
}
