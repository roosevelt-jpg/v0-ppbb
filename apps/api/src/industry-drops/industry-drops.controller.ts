import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { IndustryDropsService } from './industry-drops.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/industry-drops')
export class IndustryDropsController {
  constructor(private readonly service: IndustryDropsService) {}

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

  @Get('packs')
  packs() {
    return this.service.packs();
  }

  @Post('install')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  install(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.install(session, body ?? {}, clientIp(req));
  }
  @Post('configure')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  configure(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.configure(session, body ?? {}, clientIp(req));
  }
  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  evaluate(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.evaluate(session, body ?? {}, clientIp(req));
  }
  @Post('export')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  export(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.export(session, body ?? {}, clientIp(req));
  }
}
