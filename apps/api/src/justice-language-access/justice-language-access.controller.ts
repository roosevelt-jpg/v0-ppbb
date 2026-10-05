import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JusticeLanguageAccessService } from './justice-language-access.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/justice-language-access')
export class JusticeLanguageAccessController {
  constructor(private readonly service: JusticeLanguageAccessService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('cases')
  @UseGuards(ClerkAuthGuard)
  cases(@CurrentSession() session: SessionContext) {
    return this.service.cases(session.organizationId);
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

  @Post('brief')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  brief(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.brief(session, body ?? {}, clientIp(req));
  }

  @Post('rights')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  rights(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.rights(session, body ?? {}, clientIp(req));
  }
}
