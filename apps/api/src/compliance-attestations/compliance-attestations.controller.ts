import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ComplianceAttestationsService } from './compliance-attestations.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/compliance-attestations')
export class ComplianceAttestationsController {
  constructor(private readonly service: ComplianceAttestationsService) {}

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

  @Get('frameworks')
  frameworks() {
    return this.service.frameworks();
  }
  @Get('industries')
  industries() {
    return this.service.industries();
  }

  @Post('issue')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  issue(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.issue(session, body ?? {}, clientIp(req));
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
  @Post('dpa')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  dpa(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.dpa(session, body ?? {}, clientIp(req));
  }
  @Post('evidence')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  evidence(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.evidence(session, body ?? {}, clientIp(req));
  }
}
