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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { VoiceRecorderPluginService } from './voice-recorder-plugin.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { audioMaxBytes } from '../audio/audio-limits';

type AuthReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/voice-recorder-plugin')
export class VoiceRecorderPluginController {
  constructor(private readonly service: VoiceRecorderPluginService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('manifest')
  manifest(@Query('platform') platform?: string) {
    return this.service.manifest(platform);
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

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  sessions(@Req() req: AuthReq, @Body() body: Record<string, unknown>) {
    return this.service.sessions(
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

  @Get('sessions/:id')
  @UseGuards(TranslateAuthGuard)
  getSession(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.getSession(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
      },
      id,
    );
  }

  @Post('transcribe')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  transcribe(
    @Req() req: AuthReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body()
    body: {
      sessionId?: string;
      language?: string;
      tier?: string;
      title?: string;
    },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.service.transcribe(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        userId: req.sessionAuth?.userId,
        apiKeyId: req.translateAuth.apiKeyId,
        ip: clientIp(req),
      },
      {
        file,
        sessionId: body.sessionId,
        language: body.language,
        tier: body.tier,
        title: body.title,
      },
    );
  }

  @Post('finalize')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  finalize(@Req() req: AuthReq, @Body() body: Record<string, unknown>) {
    return this.service.finalize(
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
