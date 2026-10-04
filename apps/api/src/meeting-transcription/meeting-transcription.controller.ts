import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { MeetingTranscriptionService } from './meeting-transcription.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { audioMaxBytes } from '../audio/audio-limits';
import {
  parseIndustryPacks,
  parseStringList,
} from '../speech-recognition/speech-recognition.service';

type AuthReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/meeting-transcription')
export class MeetingTranscriptionController {
  constructor(private readonly meetings: MeetingTranscriptionService) {}

  @Get('engine')
  engine() {
    return this.meetings.engine();
  }

  @Get('languages')
  languages() {
    return this.meetings.languages();
  }

  @Get('monitoring')
  monitoring() {
    return this.meetings.monitoring();
  }

  @Get('overview')
  @UseGuards(TranslateAuthGuard)
  overview(@Req() req: AuthReq) {
    return this.meetings.overview({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      role: req.sessionAuth?.role,
      apiKeyId: req.translateAuth.apiKeyId,
    });
  }

  @Get('activity')
  @UseGuards(TranslateAuthGuard)
  activity(@Req() req: AuthReq) {
    return this.meetings.activity(req.translateAuth.organizationId);
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  sessions(@Req() req: AuthReq, @Body() body: Record<string, unknown>) {
    return this.meetings.sessions(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        userId: req.sessionAuth?.userId,
        role: req.sessionAuth?.role,
        apiKeyId: req.translateAuth.apiKeyId,
        ip: clientIp(req),
      },
      body ?? {},
    );
  }

  @Get('sessions/:id')
  @UseGuards(TranslateAuthGuard)
  getSession(@Req() req: AuthReq, @Param('id') id: string) {
    return this.meetings.getSession(
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
      language?: string;
      translateTo?: string;
      sessionId?: string;
      industryPacks?: string;
      vocabulary?: string;
    },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.meetings.transcribe(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        apiKeyId: req.translateAuth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      },
      {
        file,
        language: body.language,
        translateTo: body.translateTo,
        sessionId: body.sessionId,
        industryPacks: parseIndustryPacks(body.industryPacks),
        vocabulary: parseStringList(body.vocabulary),
      },
    );
  }

  @Post('recap')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  recap(@Req() req: AuthReq, @Body() body: Record<string, unknown>) {
    return this.meetings.recap(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        apiKeyId: req.translateAuth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      },
      body ?? {},
    );
  }
}
