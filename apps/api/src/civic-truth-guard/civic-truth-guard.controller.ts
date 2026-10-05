import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CivicTruthGuardService } from './civic-truth-guard.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/civic-truth-guard')
export class CivicTruthGuardController {
  constructor(private readonly service: CivicTruthGuardService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('signals')
  signals() {
    return this.service.signals();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
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

  @Post('assess')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  assess(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.assess(session, body ?? {}, clientIp(req));
  }

  @Post('verify-seal')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  verifySeal(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.verifySeal(session, body ?? {}, clientIp(req));
  }

  @Post('report')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  report(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.report(session, body ?? {}, clientIp(req));
  }
}
