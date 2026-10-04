import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { ModelRuntimeService } from './model-runtime.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';
import type { EnterpriseSector } from './enterprise-unlocks';

const SECTORS = new Set<EnterpriseSector>(['government', 'banking', 'hospital']);

@Controller('v1/model-runtime')
export class ModelRuntimeController {
  constructor(private readonly service: ModelRuntimeService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('deploy')
  deploy() {
    return this.service.deploy();
  }

  @Get('packs')
  packs() {
    return this.service.packs();
  }

  @Get('eval')
  eval() {
    return this.service.eval();
  }

  @Get('modalities/smoke')
  modalitiesSmoke() {
    return this.service.modalitiesSmoke();
  }

  @Get('unlocks')
  unlocks() {
    return this.service.unlocks();
  }

  @Get('unlocks/:sector')
  unlockSector(@Param('sector') sector: string) {
    if (!SECTORS.has(sector as EnterpriseSector)) {
      throw new ApiException(
        'validation_error',
        'sector must be government|banking|hospital',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.service.unlockSector(sector as EnterpriseSector);
  }

  @Post('unlocks/:sector/assert')
  @UseGuards(ClerkAuthGuard)
  assertUnlock(
    @Param('sector') sector: string,
    @Body() body: { metIds?: string[] },
  ) {
    if (!SECTORS.has(sector as EnterpriseSector)) {
      throw new ApiException(
        'validation_error',
        'sector must be government|banking|hospital',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.service.assertUnlock(sector as EnterpriseSector, body.metIds ?? []);
  }

  @Post('translate')
  translate(@Body() body: { text?: string; source?: string; target?: string; accent?: string }) {
    if (!body.text?.trim() || !body.source?.trim() || !body.target?.trim()) {
      throw new ApiException(
        'validation_error',
        'text, source, and target are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.service.translate({
      text: body.text,
      source: body.source,
      target: body.target,
      accent: body.accent,
    });
  }

  @Post('gateway/translate')
  gatewayTranslate(@Body() body: { text?: string; source?: string; target?: string }) {
    if (!body.text?.trim() || !body.source?.trim() || !body.target?.trim()) {
      throw new ApiException(
        'validation_error',
        'text, source, and target are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.service.gatewayTranslate({
      text: body.text,
      source: body.source,
      target: body.target,
    });
  }

  @Post('gateway/chat')
  gatewayChat(@Body() body: { message?: string }) {
    if (!body.message?.trim()) {
      throw new ApiException('validation_error', 'message is required', HttpStatus.BAD_REQUEST);
    }
    return this.service.gatewayChat({ message: body.message });
  }

  @Post('gateway/detect')
  gatewayDetect(@Body() body: { text?: string }) {
    if (!body.text?.trim()) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    return this.service.gatewayDetect({ text: body.text });
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.service.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }
}
