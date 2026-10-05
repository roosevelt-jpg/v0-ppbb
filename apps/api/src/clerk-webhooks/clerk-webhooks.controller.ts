import { Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiException } from '../common/errors/api-exception';
import { HttpStatus } from '@nestjs/common';
import { ClerkWebhooksService } from './clerk-webhooks.service';

@Controller('v1/clerk/webhooks')
export class ClerkWebhooksController {
  constructor(private readonly webhooks: ClerkWebhooksService) {}

  @Post()
  async receive(@Req() req: Request & { rawBody?: Buffer }) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new ApiException(
        'invalid_webhook',
        'Raw body unavailable for webhook verification',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.webhooks.handleRaw(rawBody, req.headers as Record<string, string | string[] | undefined>);
  }
}
