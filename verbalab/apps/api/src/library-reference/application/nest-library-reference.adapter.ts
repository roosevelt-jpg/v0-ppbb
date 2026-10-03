import { Injectable } from '@nestjs/common';
import { LibraryReferenceService } from '../library-reference.service';
import { LibraryReferenceEnginePort } from './ports';

@Injectable()
export class NestLibraryReferenceAdapter implements LibraryReferenceEnginePort {
  constructor(private readonly service: LibraryReferenceService) {}
  engine() {
    return this.service.products();
  }
}
