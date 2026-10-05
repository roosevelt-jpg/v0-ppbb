import { Module, forwardRef } from '@nestjs/common';
import { WebhookService } from '../jobs/webhook.service';
import { PartnerWebhooksController } from './partner-webhooks.controller';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [forwardRef(() => IdentityModule)],
  controllers: [PartnerWebhooksController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhooksModule {}
