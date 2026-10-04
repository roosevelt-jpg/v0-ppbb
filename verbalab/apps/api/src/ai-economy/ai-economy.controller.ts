import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { AiEconomyService } from './ai-economy.service';

@Controller('v1/ai-economy')
export class AiEconomyController {
  constructor(private readonly aie: AiEconomyService) {}

  @Get('products')
  products() { return this.aie.products(); }

  @Get('engine')
  engine() { return this.aie.products(); }

  @Get('routing')
  routing() { return this.aie.routing(); }

  @Get('guards')
  guards() { return this.aie.guards(); }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) { return this.aie.overview(session); }

  @Get('records')
  @UseGuards(ClerkAuthGuard)
  records(@CurrentSession() session: SessionContext, @Query('domain') domain?: string) {
    return this.aie.records(session, domain);
  }

  @Post('records')
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Body() body: { domain: string; kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    return this.aie.createRecord(session, body);
  }

  @Get('monitoring')
  monitoring() { return this.aie.monitoring(); }
}
