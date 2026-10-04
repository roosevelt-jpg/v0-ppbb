import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { EcosystemCloudService } from './ecosystem-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/ecosystem-cloud')
export class EcosystemCloudController {
  constructor(private readonly ecosystem: EcosystemCloudService) {}

  @Get('products')
  products() {
    return this.ecosystem.products();
  }

  @Get('engine')
  engine() {
    return this.ecosystem.products();
  }

  @Get('routing')
  routing() {
    return this.ecosystem.routing();
  }

  @Get('marketplaces/:kind')
  marketplace(@Param('kind') kind: string) {
    const normalized = kind === 'template' ? 'templates' : kind === 'extension' ? 'extensions' : kind;
    if (normalized !== 'sdk' && normalized !== 'templates' && normalized !== 'extensions') {
      throw new NotFoundException(`Unknown marketplace kind: ${kind}`);
    }
    return this.ecosystem.marketplace(normalized);
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.ecosystem.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.ecosystem.monitoring();
  }
}
