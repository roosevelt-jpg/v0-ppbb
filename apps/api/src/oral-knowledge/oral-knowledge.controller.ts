import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { OralKnowledgeService } from './oral-knowledge.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/oral-knowledge')
export class OralKnowledgeController {
  constructor(private readonly service: OralKnowledgeService) {}

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

  @Get('collections')
  collections() {
    return this.service.collections();
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

  @Post('cite')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  cite(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.cite(session, body ?? {}, clientIp(req));
  }

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  query(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.query(session, body ?? {}, clientIp(req));
  }
}
