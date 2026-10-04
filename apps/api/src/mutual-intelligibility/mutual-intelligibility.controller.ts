
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { MutualIntelligibilityService } from './mutual-intelligibility.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/mutual-intelligibility')
export class MutualIntelligibilityController {
  constructor(private readonly service: MutualIntelligibilityService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.service.overview(session);
  }

  @Get('corridors')
  corridors() {
    return this.service.listCorridors();
  }

  @Post('corridors/:id/locales')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  register(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.registerLocale(session, id, body ?? {}, clientIp(req));
  }

  @Post('bridge')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  bridge(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.bridge(session, body ?? {}, clientIp(req));
  }

  @Post('score')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  score(@Body() body: Record<string, unknown>) {
    return this.service.score(body ?? {});
  }
}
