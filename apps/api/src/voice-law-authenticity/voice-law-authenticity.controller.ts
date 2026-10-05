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
import { VoiceLawAuthenticityService } from './voice-law-authenticity.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { audioMaxBytes } from '../audio/audio-limits';
import { AudioService } from '../audio/audio.service';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/voice-law-authenticity')
export class VoiceLawAuthenticityController {
  constructor(
    private readonly service: VoiceLawAuthenticityService,
    private readonly audio: AudioService,
  ) {}

  private auth(req: AuthedReq) {
    return {
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    };
  }

  private sessionFrom(req: AuthedReq): SessionContext {
    return {
      userId: req.sessionAuth?.userId ?? 'api',
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      clerkUserId: req.sessionAuth?.clerkUserId ?? 'api',
      role: req.sessionAuth?.role ?? 'member',
    };
  }

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('overview')
  @UseGuards(TranslateAuthGuard)
  overview(@Req() req: AuthedReq) {
    return this.service.overview(this.sessionFrom(req));
  }

  @Get('reports')
  @UseGuards(TranslateAuthGuard)
  list(@Req() req: AuthedReq) {
    return this.service.listReports(req.translateAuth.organizationId);
  }

  @Get('reports/:id')
  @UseGuards(TranslateAuthGuard)
  get(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.service.getReport(req.translateAuth.organizationId, id);
  }

  @Get('expert-reviews')
  @UseGuards(TranslateAuthGuard)
  expertReviews(@Req() req: AuthedReq, @Query('reportId') reportId?: string) {
    return this.service.listExpertReviews(req.translateAuth.organizationId, reportId);
  }

  @Post('reports/:id/expert-review')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  requestExpertReview(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.requestExpertReview(
      this.sessionFrom(req),
      id,
      body ?? {},
      clientIp(req),
    );
  }

  @Post('expert-reviews/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  updateExpertReview(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.updateExpertReview(
      this.sessionFrom(req),
      id,
      body ?? {},
      clientIp(req),
    );
  }

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  analyze(
    @Req() req: AuthedReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body()
    body: {
      caseRef?: string;
      claimedSpeaker?: string;
      profileId?: string;
      sealToken?: string;
      appendEvidence?: string;
      threshold?: string;
      africanLanguageHint?: string;
      telephonyCodec?: string;
    },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    this.audio.assertAllowedAudio(file);
    return this.service.analyze(this.auth(req), {
      file,
      caseRef: body.caseRef?.trim() || undefined,
      claimedSpeaker: body.claimedSpeaker?.trim() || undefined,
      profileId: body.profileId?.trim() || undefined,
      sealToken: body.sealToken?.trim() || undefined,
      appendEvidence: body.appendEvidence === 'true' || body.appendEvidence === '1',
      threshold: body.threshold ? Number(body.threshold) : undefined,
      africanLanguageHint: body.africanLanguageHint?.trim() || undefined,
      telephonyCodec: body.telephonyCodec?.trim() || undefined,
    });
  }
}
