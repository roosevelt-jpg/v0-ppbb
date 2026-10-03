import { Injectable } from '@nestjs/common';
import { DigitalCivilizationService } from '../digital-civilization.service';
import { DigitalCivilizationEnginePort } from './ports';

@Injectable()
export class NestDigitalCivilizationAdapter implements DigitalCivilizationEnginePort {
  constructor(private readonly service: DigitalCivilizationService) {}
  engine() { return this.service.products(); }
}
