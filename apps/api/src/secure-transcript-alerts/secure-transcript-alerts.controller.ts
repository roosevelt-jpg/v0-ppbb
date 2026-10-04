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
import { SecureTranscriptAlertsService } from './secure-transcript-alerts.service';
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

@Controller('v1/secure-transcript-alerts')
export class SecureTranscriptAlertsController {
  constructor(private readonly service: SecureTranscriptAlertsService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('protocols')
  protocols() {
    return this.service.protocols();
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

  @Post('protect')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  protect(
    @Req() req: AuthReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: Record<string, string>,
  ) {
    return this.service.protect(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        userId: req.sessionAuth?.userId,
        apiKeyId: req.translateAuth.apiKeyId,
        ip: clientIp(req),
      },
      {
        file,
        text: body.text,
        language: body.language,
        channel: body.channel,
        to: body.to,
        consentToken: body.consentToken,
        protocol: body.protocol,
        trustedName: body.trustedName,
      },
    );
  }

  @Post('notify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  notify(@Req() req: AuthReq, @Body() body: Record<string, unknown>) {
    return this.service.notify(
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

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  verify(@Req() req: AuthReq, @Body() body: Record<string, unknown>) {
    if (!body?.alertId && !body?.receiptToken) {
      throw new ApiException('validation_error', 'alertId or receiptToken required', HttpStatus.BAD_REQUEST);
    }
    return this.service.verify(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        userId: req.sessionAuth?.userId,
      },
      body ?? {},
    );
  }
}
