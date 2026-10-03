import { Controller, Get, Param, Query } from '@nestjs/common';
import { LibraryReferenceService } from './library-reference.service';

@Controller('v1/library-reference')
export class LibraryReferenceController {
  constructor(private readonly service: LibraryReferenceService) {}

  @Get('products')
  products() {
    return this.service.products();
  }

  @Get('engine')
  engine() {
    return this.service.products();
  }

  @Get('index')
  index(@Query('volume') volume?: string) {
    const n = volume == null || volume === '' ? undefined : Number(volume);
    return this.service.index(Number.isFinite(n) ? n : undefined);
  }

  @Get('risks')
  risks() {
    return this.service.risks();
  }

  @Get('vision')
  vision() {
    return this.service.vision();
  }

  @Get('documents/:slug')
  document(@Param('slug') slug: string) {
    const allowed = ['master-phase-index', 'deeper-risk-notes', 'ai-internet-and-beyond'] as const;
    if (!(allowed as readonly string[]).includes(slug)) {
      return {
        error: 'unknown_document',
        allowed,
        honesty: this.service.products().honesty,
      };
    }
    return this.service.document(slug as (typeof allowed)[number]);
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }
}
