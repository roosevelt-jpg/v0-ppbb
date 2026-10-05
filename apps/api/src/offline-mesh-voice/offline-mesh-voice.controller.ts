
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { OfflineMeshVoiceService } from './offline-mesh-voice.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/offline-mesh-voice')
export class OfflineMeshVoiceController {
  constructor(private readonly service: OfflineMeshVoiceService) {}

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

  @Get('nodes')
  @UseGuards(ClerkAuthGuard)
  nodes(@CurrentSession() session: SessionContext) {
    return this.service.listNodes(session.organizationId);
  }

  @Get('receipts/:id')
  @UseGuards(ClerkAuthGuard)
  receipt(@CurrentSession() session: SessionContext, @Param('id') id: string) {
    return this.service.getReceipt(session.organizationId, id);
  }

  @Post('nodes')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  register(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.registerNode(session, body ?? {}, clientIp(req));
  }

  @Post('queue')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  queue(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.enqueue(session, body ?? {}, clientIp(req));
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  sync(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.sync(session, body ?? {}, clientIp(req));
  }
}
