import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { DigitalCivilizationService } from './digital-civilization.service';

@Controller('v1/digital-civilization')
export class DigitalCivilizationController {
  constructor(private readonly dciv: DigitalCivilizationService) {}

  @Get('products')
  products() { return this.dciv.products(); }

  @Get('engine')
  engine() { return this.dciv.products(); }

  @Get('routing')
  routing() { return this.dciv.routing(); }

  @Get('guards')
  guards() { return this.dciv.guards(); }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) { return this.dciv.overview(session); }

  @Get('records')
  @UseGuards(ClerkAuthGuard)
  records(@CurrentSession() session: SessionContext, @Query('domain') domain?: string) {
    return this.dciv.records(session, domain);
  }

  @Post('records')
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Body() body: { domain: string; kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    return this.dciv.createRecord(session, body);
  }

  @Get('monitoring')
  monitoring() { return this.dciv.monitoring(); }
}
