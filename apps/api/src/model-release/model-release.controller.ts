import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ModelReleaseService } from './model-release.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/model-release')
export class ModelReleaseController {
  constructor(private readonly service: ModelReleaseService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('skus')
  skus() {
    return this.service.listSkus();
  }

  @Get('skus/:id')
  sku(@Param('id') id: string) {
    return this.service.getSku(id);
  }

  @Get('gpu-budget')
  gpuBudget() {
    return this.service.gpuBudget();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.service.overview(session);
  }

  @Get('priority')
  @UseGuards(ClerkAuthGuard)
  priority(@CurrentSession() session: SessionContext) {
    return this.service.priority(session.organizationId);
  }

  @Get('releases')
  @UseGuards(ClerkAuthGuard)
  releases(@CurrentSession() session: SessionContext) {
    return this.service.listReleases(session.organizationId);
  }

  @Post('gate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  gate(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.runGate(session, body ?? {}, clientIp(req));
  }

  @Post('releases')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.createRelease(session, body ?? {}, clientIp(req));
  }

  @Post('releases/:id/promote')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  promote(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.promote(session, id, body ?? {}, clientIp(req));
  }
}
