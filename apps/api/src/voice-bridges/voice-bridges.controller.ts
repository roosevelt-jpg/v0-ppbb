import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { VoiceBridgesService } from './voice-bridges.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { audioMaxBytes } from '../audio/audio-limits';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/voice-bridges')
export class VoiceBridgesController {
  constructor(private readonly bridges: VoiceBridgesService) {}

  @Get('engine')
  engine() {
    return this.bridges.engine();
  }

  @Get('platforms/:id/snippet')
  platformSnippet(@Req() req: Request, @Param('id') id: string) {
    return this.bridges.integrationSnippet(id, publicBase(req));
  }

  @Get('platforms/:id')
  platform(@Param('id') id: string) {
    return this.bridges.platform(id);
  }

  @Get('vapi/assistant-snippet')
  vapiSnippet(@Req() req: Request) {
    return this.bridges.vapiAssistantSnippet(publicBase(req));
  }

  @Post('vapi/tts')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async vapiTts(
    @Req() req: AuthedReq,
    @Res() res: Response,
    @Body() body: Record<string, unknown>,
    @Headers('x-verbalab-voice') voiceHeader?: string,
  ) {
    const result = await this.bridges.vapiTts(body ?? {}, orgMeta(req), voiceHeader);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', String(result.pcm.length));
    res.setHeader('X-VerbaLab-Sample-Rate', String(result.sampleRate));
    res.status(HttpStatus.OK).send(result.pcm);
  }

  @Post('vapi/stt')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  vapiSttHttp(
    @Req() req: AuthedReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { language?: string; audioBase64?: string },
  ) {
    let buffer = file?.buffer;
    let filename = file?.originalname || 'speech.wav';
    let mimeType = file?.mimetype || 'audio/wav';
    if (!buffer?.length && body.audioBase64) {
      buffer = Buffer.from(body.audioBase64, 'base64');
      filename = 'speech.wav';
      mimeType = 'audio/wav';
    }
    if (!buffer?.length) {
      throw new ApiException('bad_request', 'file or audioBase64 required', HttpStatus.BAD_REQUEST);
    }
    return this.bridges.vapiSttHttp(
      { buffer, filename, mimeType, language: body.language },
      orgMeta(req),
    );
  }

  @Get('twilio/status')
  twilioStatus(@Req() req: Request) {
    return this.bridges.twilioStatus(publicBase(req));
  }

  @Get('amazon/polly/voices')
  pollyVoices() {
    return this.bridges.amazonPollyVoices();
  }

  @Post('amazon/polly/speech')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async pollySpeech(@Req() req: AuthedReq, @Res() res: Response, @Body() body: Record<string, unknown>) {
    const result = await this.bridges.amazonPollySpeech(body ?? {}, orgMeta(req));
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('x-amzn-RequestCharacters', String(result.RequestCharacters));
    res.setHeader('x-amzn-VoiceId', result.VoiceId);
    res.status(HttpStatus.OK).send(result.audio);
  }

  @Post('amazon/lex/fulfillment')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  lex(@Req() req: AuthedReq, @Body() body: Record<string, unknown>) {
    return this.bridges.amazonLexFulfillment(body ?? {}, orgMeta(req));
  }

  @Post('amazon/connect/contact')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  connect(@Req() req: AuthedReq, @Body() body: Record<string, unknown>) {
    return this.bridges.amazonConnectContact(body ?? {}, orgMeta(req));
  }

  /** Google Cloud TTS–shaped body; path omits colon for Nest routing (`text:synthesize` → `synthesize`). */
  @Post(['google/texttospeech/v1/synthesize', 'google/texttospeech/v1/text/synthesize'])
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  googleTts(@Req() req: AuthedReq, @Body() body: Record<string, unknown>) {
    return this.bridges.googleTts(body ?? {}, orgMeta(req));
  }

  /** Google Cloud STT–shaped body (`speech:recognize` → `recognize`). */
  @Post(['google/speech/v1/recognize', 'google/speech/v1/speech/recognize'])
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  googleStt(@Req() req: AuthedReq, @Body() body: Record<string, unknown>) {
    return this.bridges.googleSpeechRecognize(body ?? {}, orgMeta(req));
  }

  @Post('google/dialogflow/webhook')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  dialogflow(@Req() req: AuthedReq, @Body() body: Record<string, unknown>) {
    return this.bridges.dialogflowWebhook(body ?? {}, orgMeta(req));
  }

  @Get('google/voice/status')
  googleVoice() {
    return this.bridges.googleVoiceStatus();
  }

  @Get('elevenlabs/v1/voices')
  elevenVoices() {
    return this.bridges.elevenLabsVoices();
  }

  @Post('elevenlabs/v1/text-to-speech/:voiceId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async elevenTts(
    @Req() req: AuthedReq,
    @Res() res: Response,
    @Param('voiceId') voiceId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const speech = await this.bridges.elevenLabsTts(voiceId, body ?? {}, orgMeta(req));
    res.setHeader('Content-Type', speech.mimeType);
    res.setHeader('X-VerbaLab-Provider', speech.provider);
    res.setHeader('X-VerbaLab-Characters', String(speech.characters));
    res.status(HttpStatus.OK).send(speech.audio);
  }

  @Get('sip/trunk')
  sipTrunk(@Req() req: Request) {
    return this.bridges.sipTrunk(publicBase(req));
  }

  @Post('sip/invite-hook')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  sipInvite(@Req() req: AuthedReq, @Body() body: Record<string, unknown>) {
    return this.bridges.sipInviteHook(body ?? {}, orgMeta(req));
  }

  @Get('webrtc/status')
  webrtc(@Req() req: Request) {
    return this.bridges.webrtcStatus(publicBase(req));
  }
}

function orgMeta(req: AuthedReq) {
  return {
    organizationId: req.translateAuth.organizationId,
    workspaceId: req.translateAuth.workspaceId,
    apiKeyId: req.translateAuth.apiKeyId,
    userId: req.sessionAuth?.userId,
    ip: clientIp(req),
  };
}

function publicBase(req: Request) {
  const proto = String(req.headers['x-forwarded-proto'] ?? req.protocol ?? 'http');
  const host = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? 'localhost:3001');
  return `${proto}://${host}`;
}
