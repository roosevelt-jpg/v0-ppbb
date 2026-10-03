import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { GlobalAiStandardsService } from './global-ai-standards.service';

@Controller('v1/global-ai-standards')
export class GlobalAiStandardsController {
  constructor(private readonly vgas: GlobalAiStandardsService) {}

  @Get('products')
  products() { return this.vgas.products(); }

  @Get('engine')
  engine() { return this.vgas.products(); }

  @Get('routing')
  routing() { return this.vgas.routing(); }

  @Get('verify/:code')
  verify(@Param('code') code: string) { return this.vgas.verify(code); }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) { return this.vgas.overview(session); }

  @Get('records')
  @UseGuards(ClerkAuthGuard)
  records(@CurrentSession() session: SessionContext, @Query('domain') domain?: string) {
    return this.vgas.records(session, domain);
  }

  @Post('records')
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Body() body: { domain: string; kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; verifyCode?: string; content?: Record<string, unknown> },
  ) {
    return this.vgas.createRecord(session, body);
  }

  @Get('monitoring')
  monitoring() { return this.vgas.monitoring(); }
}
