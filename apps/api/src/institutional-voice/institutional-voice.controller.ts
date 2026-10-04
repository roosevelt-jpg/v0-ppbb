
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { InstitutionalVoiceService } from './institutional-voice.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/institutional-voice')
export class InstitutionalVoiceController {
  constructor(private readonly service: InstitutionalVoiceService) {}

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

  @Get('corpus')
  @UseGuards(ClerkAuthGuard)
  corpus(@CurrentSession() session: SessionContext) {
    return this.service.listCorpus(session.organizationId);
  }

  @Post('agencies')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  agencies(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.registerAgency(session, body ?? {}, clientIp(req));
  }

  @Post('corpus')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  ingest(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.ingest(session, body ?? {}, clientIp(req));
  }

  @Post('speak')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  speak(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.speak(session, body ?? {}, clientIp(req));
  }
}
