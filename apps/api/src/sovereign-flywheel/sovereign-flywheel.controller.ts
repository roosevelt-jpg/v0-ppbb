import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SovereignFlywheelService } from './sovereign-flywheel.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/sovereign-flywheel')
export class SovereignFlywheelController {
  constructor(private readonly service: SovereignFlywheelService) {}

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

  @Get('jobs')
  jobs() {
    return this.service.jobs();
  }
  @Get('datasets')
  datasets() {
    return this.service.datasets();
  }

  @Post('ingest')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  ingest(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.ingest(session, body ?? {}, clientIp(req));
  }
  @Post('curate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  curate(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.curate(session, body ?? {}, clientIp(req));
  }
  @Post('finetune')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  finetune(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.finetune(session, body ?? {}, clientIp(req));
  }
  @Post('promote')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  promote(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.promote(session, body ?? {}, clientIp(req));
  }
}
