import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { EdgeOfflineService } from './edge-offline.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/edge-offline')
export class EdgeOfflineController {
  constructor(private readonly service: EdgeOfflineService) {}

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

  @Get('catalog')
  catalog() {
    return this.service.catalog();
  }

  @Post('build')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  build(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.build(session, body ?? {}, clientIp(req));
  }
  @Post('sign')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  sign(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.sign(session, body ?? {}, clientIp(req));
  }
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  sync(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.sync(session, body ?? {}, clientIp(req));
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
}
