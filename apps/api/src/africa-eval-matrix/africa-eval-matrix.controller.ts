import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AfricaEvalMatrixService } from './africa-eval-matrix.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/africa-eval-matrix')
export class AfricaEvalMatrixController {
  constructor(private readonly service: AfricaEvalMatrixService) {}

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

  @Get('matrix')
  matrix() {
    return this.service.matrix();
  }
  @Get('languages')
  languages() {
    return this.service.languages();
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
  @Post('compare')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  compare(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.compare(session, body ?? {}, clientIp(req));
  }
  @Post('suite')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  suite(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.suite(session, body ?? {}, clientIp(req));
  }
  @Post('publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  publish(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.publish(session, body ?? {}, clientIp(req));
  }
}
