import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { GlobalLanguagePreservationService } from './global-language-preservation.service';

@Controller('v1/global-language-preservation')
export class GlobalLanguagePreservationController {
  constructor(private readonly service: GlobalLanguagePreservationService) {}

  @Get('engine')
  engine() { return this.service.engine(); }

  @Get('products')
  products() { return this.service.products(); }

  @Get('monitoring')
  monitoring() { return this.service.monitoring(); }

  @Get('routes')
  routes() { return this.service.routes(); }

  @Get('records')
  @UseGuards(ClerkAuthGuard)
  records(@CurrentSession() session: SessionContext) { return this.service.records(session); }

  @Post('records')
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Body() body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    return this.service.createRecord(session, body);
  }
}
