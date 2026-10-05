import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CivicVoiceSealService } from './civic-voice-seal.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/civic-voice-seal')
export class CivicVoiceSealController {
  constructor(private readonly service: CivicVoiceSealService) {}

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

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  verify(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.verify(session, body ?? {}, clientIp(req));
  }

  @Post('challenge')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  challenge(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.challenge(session, body ?? {}, clientIp(req));
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
