import { Injectable } from '@nestjs/common';
import { EconomicIntelligenceService } from '../economic-intelligence.service';
import { EconomicIntelligenceEnginePort } from './ports';

@Injectable()
export class NestEconomicIntelligenceAdapter implements EconomicIntelligenceEnginePort {
  constructor(private readonly service: EconomicIntelligenceService) {}
  engine() {
    return this.service.engine();
  }
}
