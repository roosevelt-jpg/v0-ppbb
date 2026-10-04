import { Injectable } from '@nestjs/common';
import { SmartCityPlatformService } from '../smart-city-platform.service';
import { SmartCityPlatformEnginePort } from './ports';

@Injectable()
export class NestSmartCityPlatformAdapter implements SmartCityPlatformEnginePort {
  constructor(private readonly service: SmartCityPlatformService) {}
  engine() { return this.service.engine(); }
}
