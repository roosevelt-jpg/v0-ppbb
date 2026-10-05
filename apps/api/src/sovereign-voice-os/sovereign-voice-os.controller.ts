
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SovereignVoiceOsService } from './sovereign-voice-os.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/sovereign-voice-os')
export class SovereignVoiceOsController {
  constructor(private readonly service: SovereignVoiceOsService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('pillars')
  pillars() {
    return this.service.pillars();
  }

  @Get('readiness')
  readiness() {
    return this.service.readiness();
  }

  @Get('integrations')
  integrations() {
    return this.service.integrations();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.service.overview(session);
  }

  @Post('compose')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  compose(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.compose(session, body ?? {}, clientIp(req));
  }
}
