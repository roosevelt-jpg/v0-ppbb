import { Injectable } from '@nestjs/common';
import { AiLicensingPlatformService } from '../ai-licensing-platform.service';
import { AiLicensingPlatformEnginePort } from './ports';

@Injectable()
export class NestAiLicensingPlatformAdapter implements AiLicensingPlatformEnginePort {
  constructor(private readonly service: AiLicensingPlatformService) {}
  engine() {
    return this.service.engine();
  }
}
