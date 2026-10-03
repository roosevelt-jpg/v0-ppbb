import { Injectable } from '@nestjs/common';
import { EnterpriseNationPlatformService } from '../enterprise-nation-platform.service';
import { EnterpriseNationPlatformEnginePort } from './ports';

@Injectable()
export class NestEnterpriseNationPlatformAdapter implements EnterpriseNationPlatformEnginePort {
  constructor(private readonly service: EnterpriseNationPlatformService) {}
  engine() { return this.service.engine(); }
}
