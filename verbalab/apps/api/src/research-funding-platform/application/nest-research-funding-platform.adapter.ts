import { Injectable } from '@nestjs/common';
import { ResearchFundingPlatformService } from '../research-funding-platform.service';
import { ResearchFundingPlatformEnginePort } from './ports';

@Injectable()
export class NestResearchFundingPlatformAdapter implements ResearchFundingPlatformEnginePort {
  constructor(private readonly service: ResearchFundingPlatformService) {}
  engine() {
    return this.service.engine();
  }
}
