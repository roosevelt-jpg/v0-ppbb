import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { InterpreterMeshService } from './interpreter-mesh.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/interpreter-mesh')
export class InterpreterMeshController {
  constructor(private readonly service: InterpreterMeshService) {}

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

  @Get('backbone')
  backbone() {
    return this.service.backbone();
  }

  @Post('sessions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  sessions(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.sessions(session, body ?? {}, clientIp(req));
  }

  @Post('listen')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  listen(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.listen(session, body ?? {}, clientIp(req));
  }

  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  broadcast(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.broadcast(session, body ?? {}, clientIp(req));
  }
}
