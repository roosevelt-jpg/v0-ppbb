import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { VideoVoiceService, type DubMode } from './video-voice.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { ApiException } from '../common/errors/api-exception';
import { audioMaxBytes } from '../audio/audio-limits';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/video-voice')
export class VideoVoiceController {
  constructor(private readonly service: VideoVoiceService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.service.overview(session);
  }

  @Post('dub')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  dub(
    @Req() req: AuthedReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body()
    body: {
      text?: string;
      sourceLanguage?: string;
      targetLanguage?: string;
      target?: string;
      voice?: string;
      mode?: DubMode;
      format?: 'mp3' | 'wav';
      commercial?: string | boolean;
      durationSecondsHint?: string | number;
    },
  ) {
    const targetLanguage = (body.targetLanguage ?? body.target ?? '').trim();
    if (!targetLanguage) {
      throw new ApiException('bad_request', 'targetLanguage required', HttpStatus.BAD_REQUEST);
    }
    const commercial =
      body.commercial === true || body.commercial === 'true' || body.commercial === '1';
    return this.service.dub(
      {
        text: body.text,
        sourceAudio: file?.buffer?.length
          ? {
              buffer: file.buffer,
              filename: file.originalname || 'source.wav',
              mimeType: file.mimetype || 'application/octet-stream',
            }
          : undefined,
        sourceLanguage: body.sourceLanguage,
        targetLanguage,
        voice: body.voice,
        mode: body.mode,
        format: body.format,
        commercial,
        durationSecondsHint:
          body.durationSecondsHint != null ? Number(body.durationSecondsHint) : undefined,
      },
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        apiKeyId: req.translateAuth.apiKeyId,
        userId: req.sessionAuth?.userId,
      },
    );
  }
}
