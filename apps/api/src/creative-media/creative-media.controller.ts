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
import { CreativeMediaService } from './creative-media.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { ApiException } from '../common/errors/api-exception';
import { audioMaxBytes } from '../audio/audio-limits';

type AuthedReq = Request & { translateAuth: TranslateAuthContext };

@Controller('v1/creative-media')
export class CreativeMediaController {
  constructor(private readonly creative: CreativeMediaService) {}

  @Get('engine')
  engine() {
    return this.creative.engine();
  }

  @Get('products')
  products() {
    return this.creative.products();
  }

  @Post('voice-changer')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  voiceChanger(
    @Req() req: AuthedReq,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { pitchSemitones?: string; rate?: string },
  ) {
    if (!file?.buffer?.length) throw new ApiException('bad_request', 'file required', HttpStatus.BAD_REQUEST);
    return this.creative.voiceChanger(file.buffer, {
      pitchSemitones: body.pitchSemitones ? Number(body.pitchSemitones) : undefined,
      rate: body.rate ? Number(body.rate) : undefined,
    }, { organizationId: req.translateAuth.organizationId });
  }

  @Post('isolate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: audioMaxBytes() },
    }),
  )
  isolate(@Req() req: AuthedReq, @UploadedFile() file: Express.Multer.File | undefined) {
    if (!file?.buffer?.length) throw new ApiException('bad_request', 'file required', HttpStatus.BAD_REQUEST);
    return this.creative.isolate(file.buffer, { organizationId: req.translateAuth.organizationId });
  }

  @Post('sound-effects')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  soundEffects(
    @Req() req: AuthedReq,
    @Body() body: { prompt?: string; durationSeconds?: number },
  ) {
    if (!body.prompt?.trim()) throw new ApiException('bad_request', 'prompt required', HttpStatus.BAD_REQUEST);
    return this.creative.soundEffects(
      { prompt: body.prompt.trim(), durationSeconds: body.durationSeconds },
      { organizationId: req.translateAuth.organizationId },
    );
  }

  @Post('music')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  music(@Req() req: AuthedReq, @Body() body: { prompt?: string; durationSeconds?: number }) {
    if (!body.prompt?.trim()) throw new ApiException('bad_request', 'prompt required', HttpStatus.BAD_REQUEST);
    return this.creative.music(
      { prompt: body.prompt.trim(), durationSeconds: body.durationSeconds },
      { organizationId: req.translateAuth.organizationId },
    );
  }

  @Post('voice-design')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  voiceDesign(
    @Req() req: AuthedReq,
    @Body()
    body: {
      name?: string;
      description?: string;
      language?: string;
      gender?: string;
      accent?: string;
    },
  ) {
    if (!body.name?.trim() || !body.description?.trim()) {
      throw new ApiException('bad_request', 'name and description required', HttpStatus.BAD_REQUEST);
    }
    return this.creative.voiceDesign(
      {
        name: body.name.trim(),
        description: body.description.trim(),
        language: body.language,
        gender: body.gender,
        accent: body.accent,
      },
      { organizationId: req.translateAuth.organizationId },
    );
  }

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  image(@Req() req: AuthedReq, @Body() body: { prompt?: string; title?: string }) {
    if (!body.prompt?.trim()) throw new ApiException('bad_request', 'prompt required', HttpStatus.BAD_REQUEST);
    return this.creative.image(
      { prompt: body.prompt.trim(), title: body.title },
      { organizationId: req.translateAuth.organizationId },
    );
  }

  @Post('video')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  video(
    @Req() req: AuthedReq,
    @Body() body: { prompt?: string; durationSeconds?: number; language?: string },
  ) {
    if (!body.prompt?.trim()) throw new ApiException('bad_request', 'prompt required', HttpStatus.BAD_REQUEST);
    return this.creative.video(
      {
        prompt: body.prompt.trim(),
        durationSeconds: body.durationSeconds,
        language: body.language,
      },
      { organizationId: req.translateAuth.organizationId },
    );
  }

  @Post('ads')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  ads(
    @Req() req: AuthedReq,
    @Body() body: { product?: string; script?: string; language?: string; mood?: string },
  ) {
    if (!body.product?.trim() || !body.script?.trim()) {
      throw new ApiException('bad_request', 'product and script required', HttpStatus.BAD_REQUEST);
    }
    return this.creative.ads(
      {
        product: body.product.trim(),
        script: body.script.trim(),
        language: body.language,
        mood: body.mood,
      },
      { organizationId: req.translateAuth.organizationId },
    );
  }
}
