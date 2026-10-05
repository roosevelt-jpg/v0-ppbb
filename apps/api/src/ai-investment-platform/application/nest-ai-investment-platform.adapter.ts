import { Injectable } from '@nestjs/common';
import { AiInvestmentPlatformService } from '../ai-investment-platform.service';
import { AiInvestmentPlatformEnginePort } from './ports';

@Injectable()
export class NestAiInvestmentPlatformAdapter implements AiInvestmentPlatformEnginePort {
  constructor(private readonly service: AiInvestmentPlatformService) {}
  engine() {
    return this.service.engine();
  }
}
