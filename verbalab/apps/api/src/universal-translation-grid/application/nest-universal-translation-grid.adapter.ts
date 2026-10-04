import { Injectable } from '@nestjs/common';
import { UniversalTranslationGridService } from '../universal-translation-grid.service';
import { UniversalTranslationGridEnginePort } from './ports';

@Injectable()
export class NestUniversalTranslationGridAdapter implements UniversalTranslationGridEnginePort {
  constructor(private readonly service: UniversalTranslationGridService) {}
  engine() { return this.service.engine(); }
}
