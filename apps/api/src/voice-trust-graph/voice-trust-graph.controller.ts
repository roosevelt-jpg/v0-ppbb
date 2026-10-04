import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { VoiceTrustGraphService } from './voice-trust-graph.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/voice-trust-graph')
export class VoiceTrustGraphController {
  constructor(private readonly service: VoiceTrustGraphService) {}

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

  @Post('nodes')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  nodes(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.nodes(session, body ?? {}, clientIp(req));
  }

  @Post('consent')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  consent(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.consent(session, body ?? {}, clientIp(req));
  }

  @Post('witness')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  witness(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.witness(session, body ?? {}, clientIp(req));
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
}
