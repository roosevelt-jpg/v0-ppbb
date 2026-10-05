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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { VerbaVoiceService } from './verba-voice.service';
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

@Controller('v1/verba-voice')
export class VerbaVoiceController {
  constructor(private readonly voice: VerbaVoiceService) {}

  @Get('engine')
  engine() {
    return this.voice.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.voice.monitoring();
  }

  @Get('overview')
  @UseGuards(TranslateAuthGuard)
  overview(@Req() req: AuthReq) {
    return this.voice.overview({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      apiKeyId: req.translateAuth.apiKeyId,
    });
  }

  @Get('activity')
  @UseGuards(TranslateAuthGuard)
  activity(@Req() req: AuthReq) {
    return this.voice.activity(req.translateAuth.organizationId);
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  sessions(@Req() req: AuthReq, @Body() body: Record<string, unknown>) {
    return this.voice.sessions(
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
    return this.voice.getSession(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
      },
      id,
    );
  }

  @Get('sessions/:id/events')
  @UseGuards(TranslateAuthGuard)
  async events(
    @Req() req: AuthReq,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('after') after?: string,
    @Query('stream') stream?: string,
  ) {
    const auth = {
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    };
    if (stream === '1' || stream === 'true') {
      res.status(HttpStatus.OK);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
      const snapshot = this.voice.events(auth, id, after);
      for (const event of snapshot.events) {
        res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      }
      res.write(`event: done\ndata: ${JSON.stringify({ sessionId: id })}\n\n`);
      res.end();
      return;
    }
    res.status(HttpStatus.OK).json(this.voice.events(auth, id, after));
  }

  @Post('text-turns')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  textTurns(@Req() req: AuthReq, @Body() body: Record<string, unknown>) {
    return this.voice.textTurn(
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

  @Post('turns')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  turns(
    @Req() req: AuthReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { sessionId?: string; language?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    if (!body.sessionId?.trim()) {
      throw new ApiException('validation_error', 'sessionId is required', HttpStatus.BAD_REQUEST);
    }
    return this.voice.audioTurn(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        userId: req.sessionAuth?.userId,
        apiKeyId: req.translateAuth.apiKeyId,
        ip: clientIp(req),
      },
      {
        file,
        sessionId: body.sessionId.trim(),
        language: body.language,
      },
    );
  }

  @Post('webrtc')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  webrtc(@Req() req: AuthReq, @Body() body: Record<string, unknown>) {
    return this.voice.webrtc(
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

  @Post('webrtc/signal')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  webrtcSignal(@Req() req: AuthReq, @Body() body: Record<string, unknown>) {
    return this.voice.webrtcSignal(
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

  @Post('webrtc/barge-in')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  bargeIn(@Req() req: AuthReq, @Body() body: Record<string, unknown>) {
    return this.voice.bargeIn(
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
