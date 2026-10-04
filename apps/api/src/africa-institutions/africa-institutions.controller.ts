import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AfricaInstitutionsService } from './africa-institutions.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/africa-institutions')
export class AfricaInstitutionsController {
  constructor(private readonly service: AfricaInstitutionsService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('pillars')
  pillars() {
    return this.service.pillars();
  }

  @Get('playbooks')
  playbooks() {
    return this.service.playbooks();
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

  @Post('route')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  route(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.route(session, body ?? {}, clientIp(req));
  }
}
