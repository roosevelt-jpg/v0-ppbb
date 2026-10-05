import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { DeveloperGravityService } from './developer-gravity.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/developer-gravity')
export class DeveloperGravityController {
  constructor(private readonly service: DeveloperGravityService) {}

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

  @Post('sandbox')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  sandbox(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.sandbox(session, body ?? {}, clientIp(req));
  }
  @Post('quickstart')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  quickstart(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.quickstart(session, body ?? {}, clientIp(req));
  }
  @Post('refs')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  refs(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.refs(session, body ?? {}, clientIp(req));
  }
  @Post('sample')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  sample(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.sample(session, body ?? {}, clientIp(req));
  }
}
