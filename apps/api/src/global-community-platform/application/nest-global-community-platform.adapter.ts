import { Injectable } from '@nestjs/common';
import { GlobalCommunityPlatformService } from '../global-community-platform.service';
import { GlobalCommunityPlatformEnginePort } from './ports';

@Injectable()
export class NestGlobalCommunityPlatformAdapter implements GlobalCommunityPlatformEnginePort {
  constructor(private readonly service: GlobalCommunityPlatformService) {}
  engine() {
    return this.service.engine();
  }
}
