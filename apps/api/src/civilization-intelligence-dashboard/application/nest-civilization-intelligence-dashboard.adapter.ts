import { Injectable } from '@nestjs/common';
import { CivilizationIntelligenceDashboardService } from '../civilization-intelligence-dashboard.service';
import { CivilizationIntelligenceDashboardEnginePort } from './ports';

@Injectable()
export class NestCivilizationIntelligenceDashboardAdapter implements CivilizationIntelligenceDashboardEnginePort {
  constructor(private readonly service: CivilizationIntelligenceDashboardService) {}
  engine() { return this.service.engine(); }
}
