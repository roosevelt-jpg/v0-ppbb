import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { VoicePassportService } from './voice-passport.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/voice-passport')
export class VoicePassportController {
  constructor(private readonly service: VoicePassportService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('activity')
  @UseGuards(ClerkAuthGuard)
  activity(@CurrentSession() session: SessionContext) {
    return this.service.activity(session.organizationId);
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.service.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('directory')
  directory() {
    return this.service.directory();
  }

  @Post('issue')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  issue(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.issue(session, body ?? {}, clientIp(req));
  }
  @Post('endorse')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  endorse(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.endorse(session, body ?? {}, clientIp(req));
  }
  @Post('check')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  check(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.check(session, body ?? {}, clientIp(req));
  }
  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  revoke(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.revoke(session, body ?? {}, clientIp(req));
  }
}
