import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { A2aProtocolService } from './a2a-protocol.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/a2a-protocol')
export class A2aProtocolController {
  constructor(private readonly service: A2aProtocolService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.service.overview(session);
  }

  @Get('records')
  @UseGuards(ClerkAuthGuard)
  list(@CurrentSession() session: SessionContext) {
    return this.service.listRecords(session);
  }

  @Post('records')
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Body() body: { kind: string; title: string; summary?: string; content?: Record<string, unknown> },
  ) {
    return this.service.createRecord(session, body);
  }
}
