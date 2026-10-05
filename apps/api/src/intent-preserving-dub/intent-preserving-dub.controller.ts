import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { IntentPreservingDubService } from './intent-preserving-dub.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/intent-preserving-dub')
export class IntentPreservingDubController {
  constructor(private readonly service: IntentPreservingDubService) {}

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

  @Get('profiles')
  profiles() {
    return this.service.profiles();
  }

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  analyze(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.analyze(session, body ?? {}, clientIp(req));
  }

  @Post('dub')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  dub(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.dub(session, body ?? {}, clientIp(req));
  }

  @Post('score')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  score(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.score(session, body ?? {}, clientIp(req));
  }
}
