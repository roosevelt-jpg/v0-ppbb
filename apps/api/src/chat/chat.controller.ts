import {
  Body,
  Controller,
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
import { Request } from 'express';
import { ChatService } from './chat.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { DocumentCodecService } from '../documents/document-codec.service';
import { TranslateService } from '../translate/translate.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';

const MAX_CHAT_ATTACHMENT_BYTES = 12 * 1024 * 1024;

@Controller('v1/chat')
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly codec: DocumentCodecService,
    private readonly translate: TranslateService,
    private readonly audit: AuditService,
  ) {}

  @Post('completions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  completions(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body()
    body: {
      messages?: unknown;
      model?: string;
      translateReplyTo?: string;
    },
  ) {
    return this.chat.completions({
      messages: body.messages,
      model: body.model,
      translateReplyTo: body.translateReplyTo,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  /** Upload a document into chat — extract text, optionally translate, return chat-ready payload. */
  @Post('attachments')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_CHAT_ATTACHMENT_BYTES },
    }),
  )
  async attachments(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body()
    body: {
      source?: string;
      target?: string;
      translate?: string | boolean;
      mode?: string;
    },
  ) {
    if (!file?.buffer?.length) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }

    const extracted = await this.codec.extract(file.buffer, file.mimetype || 'text/plain', file.originalname);
    const text = extracted.paragraphs.join('\n\n').trim();
    if (!text) {
      throw new ApiException(
        'validation_error',
        'Could not extract text from that file',
        HttpStatus.BAD_REQUEST,
      );
    }

    const wantTranslate =
      body.translate === true ||
      body.translate === 'true' ||
      body.translate === '1' ||
      body.mode === 'translate' ||
      Boolean(body.target);

    let translated: {
      text: string;
      source: string;
      target: string;
      provider: string;
      characters: number;
    } | null = null;

    if (wantTranslate) {
      const target = String(body.target ?? '').trim();
      if (!target) {
        throw new ApiException(
          'validation_error',
          'target language is required when translate is enabled',
          HttpStatus.BAD_REQUEST,
        );
      }
      translated = await this.translate.translate({
        text: text.slice(0, 24_000),
        source: body.source?.trim() || 'auto',
        target,
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        apiKeyId: req.translateAuth.apiKeyId,
        skipReview: true,
      });
    }

    await this.audit.record({
      organizationId: req.translateAuth.organizationId,
      userId: req.sessionAuth?.userId,
      action: 'chat.attachment.uploaded',
      route: 'POST /v1/chat/attachments',
      ip: clientIp(req),
      metadata: {
        filename: file.originalname,
        mimeType: file.mimetype,
        bytes: file.size,
        format: extracted.format,
        translated: Boolean(translated),
      },
    });

    const preview = (translated?.text ?? text).slice(0, 12_000);
    const chatPrompt = wantTranslate
      ? `I uploaded “${file.originalname}”. Translate/review this document${body.target ? ` into ${body.target}` : ''}:\n\n${preview}`
      : `I uploaded “${file.originalname}”. Help me understand and work with this document:\n\n${preview}`;

    return {
      ok: true,
      filename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      format: extracted.format,
      characters: text.length,
      text: text.slice(0, 24_000),
      translated: translated
        ? {
            text: translated.text,
            source: translated.source,
            target: translated.target,
            provider: translated.provider,
            characters: translated.characters,
          }
        : null,
      chatPrompt,
    };
  }
}
