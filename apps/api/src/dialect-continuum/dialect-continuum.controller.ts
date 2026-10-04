import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { DialectContinuumService } from './dialect-continuum.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/dialect-continuum')
export class DialectContinuumController {
  constructor(private readonly service: DialectContinuumService) {}

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

  @Get('map')
  map() {
    return this.service.map();
  }

  @Post('detect')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  detect(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.detect(session, body ?? {}, clientIp(req));
  }

  @Post('track')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  track(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.track(session, body ?? {}, clientIp(req));
  }

  @Post('reply')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  reply(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.reply(session, body ?? {}, clientIp(req));
  }
}
