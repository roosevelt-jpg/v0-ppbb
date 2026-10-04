import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AgentVoiceTrainingService } from './agent-voice-training.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/agent-voice-training')
export class AgentVoiceTrainingController {
  constructor(private readonly service: AgentVoiceTrainingService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('models')
  models() {
    return this.service.models();
  }

  @Get('languages')
  languages(@Query('q') q?: string) {
    return this.service.languages(q);
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('overview')
  @UseGuards(TranslateAuthGuard)
  overview(@Req() req: AuthReq) {
    return this.service.overview({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      apiKeyId: req.translateAuth.apiKeyId,
    });
  }

  @Get('activity')
  @UseGuards(TranslateAuthGuard)
  activity(@Req() req: AuthReq) {
    return this.service.activity(req.translateAuth.organizationId);
  }

  @Get('personas')
  @UseGuards(TranslateAuthGuard)
  listPersonas(@Req() req: AuthReq) {
    return this.service.listPersonas(req.translateAuth.organizationId);
  }

  @Post('personas')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  createPersona(@Req() req: AuthReq, @Body() body: Record<string, unknown>) {
    return this.service.createPersona(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        userId: req.sessionAuth?.userId,
        apiKeyId: req.translateAuth.apiKeyId,
        ip: clientIp(req),
      },
      body ?? {},
    );
  }

  @Post('personas/:id/train')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  train(@Req() req: AuthReq, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.trainPersona(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        userId: req.sessionAuth?.userId,
        apiKeyId: req.translateAuth.apiKeyId,
        ip: clientIp(req),
      },
      id,
      body ?? {},
    );
  }

  @Post('personas/:id/preview')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  preview(@Req() req: AuthReq, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.previewPersona(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        userId: req.sessionAuth?.userId,
        apiKeyId: req.translateAuth.apiKeyId,
        ip: clientIp(req),
      },
      id,
      body ?? {},
    );
  }

  @Get('personas/:id/sdk')
  @UseGuards(TranslateAuthGuard)
  sdk(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.sdkPack(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        userId: req.sessionAuth?.userId,
        apiKeyId: req.translateAuth.apiKeyId,
      },
      id,
    );
  }

  @Post('export-pack')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  exportPack(@Req() req: AuthReq, @Body() body: Record<string, unknown>) {
    return this.service.exportPack(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        userId: req.sessionAuth?.userId,
        apiKeyId: req.translateAuth.apiKeyId,
        ip: clientIp(req),
      },
      body ?? {},
    );
  }
}
