
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { NationalVoiceRuntimeService } from './national-voice-runtime.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/national-voice-runtime')
export class NationalVoiceRuntimeController {
  constructor(private readonly service: NationalVoiceRuntimeService) {}

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

  @Get('zones')
  @UseGuards(ClerkAuthGuard)
  zones(@CurrentSession() session: SessionContext) {
    return this.service.listZones(session.organizationId);
  }

  @Get('zones/:id')
  @UseGuards(ClerkAuthGuard)
  zone(@CurrentSession() session: SessionContext, @Param('id') id: string) {
    return this.service.getZone(session.organizationId, id);
  }

  @Post('zones')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.createZone(session, body ?? {}, clientIp(req));
  }

  @Post('zones/:id/dialects')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  dialects(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.enableDialect(session, id, body ?? {}, clientIp(req));
  }

  @Post('zones/:id/kill-switch')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  kill(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.killSwitch(session, id, body ?? {}, clientIp(req));
  }

  @Post('zones/:id/audit-export')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  audit(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.service.auditExport(session, id, clientIp(req));
  }
}
