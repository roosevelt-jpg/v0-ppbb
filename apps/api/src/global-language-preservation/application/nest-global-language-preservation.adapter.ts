import { Injectable } from '@nestjs/common';
import { GlobalLanguagePreservationService } from '../global-language-preservation.service';
import { GlobalLanguagePreservationEnginePort } from './ports';

@Injectable()
export class NestGlobalLanguagePreservationAdapter implements GlobalLanguagePreservationEnginePort {
  constructor(private readonly service: GlobalLanguagePreservationService) {}
  engine() { return this.service.engine(); }
}
