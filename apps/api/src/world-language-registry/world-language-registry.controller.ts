import { Controller, Get, Query } from '@nestjs/common';
import { WorldLanguageRegistryService } from './world-language-registry.service';

@Controller('v1/world-language-registry')
export class WorldLanguageRegistryController {
  constructor(private readonly registry: WorldLanguageRegistryService) {}

  @Get('engine')
  engine() {
    return this.registry.engine();
  }

  @Get('products')
  products() {
    return this.registry.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.registry.monitoring();
  }

  @Get('languages')
  languages(@Query('q') q?: string) {
    return this.registry.languages(q);
  }

  @Get('families')
  families() {
    return this.registry.families();
  }
}
