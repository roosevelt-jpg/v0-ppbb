import { Injectable } from '@nestjs/common';
import { RevenueSharingPlatformService } from '../revenue-sharing-platform.service';
import { RevenueSharingPlatformEnginePort } from './ports';

@Injectable()
export class NestRevenueSharingPlatformAdapter implements RevenueSharingPlatformEnginePort {
  constructor(private readonly service: RevenueSharingPlatformService) {}
  engine() {
    return this.service.engine();
  }
}
