import { Injectable } from '@nestjs/common';
import { AiEconomyService } from '../ai-economy.service';
import { AiEconomyEnginePort } from './ports';

@Injectable()
export class NestAiEconomyAdapter implements AiEconomyEnginePort {
  constructor(private readonly service: AiEconomyService) {}
  engine() {
    return this.service.products();
  }
}
