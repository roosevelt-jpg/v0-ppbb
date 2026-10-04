import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ModelEconomyService } from './model-economy.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/model-economy')
export class ModelEconomyController {
  constructor(private readonly service: ModelEconomyService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('catalog')
  catalog(@Query('useCase') useCase?: string) {
    return this.service.catalog(useCase);
  }

  @Get('tiers')
  tiers() {
    return this.service.tiers();
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

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  quote(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.quote(session, body ?? {}, clientIp(req));
  }

  @Post('estimate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  estimate(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.estimate(session, body ?? {}, clientIp(req));
  }

  @Post('select')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  select(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.select(session, body ?? {}, clientIp(req));
  }

  @Post('meter')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  meter(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.meter(session, body ?? {}, clientIp(req));
  }
}
