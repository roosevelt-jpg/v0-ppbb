import { Module, forwardRef } from '@nestjs/common';
import { ClerkWebhooksController } from './clerk-webhooks.controller';
import { ClerkWebhooksService } from './clerk-webhooks.service';
import { OrgBootstrapService } from './org-bootstrap.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [ApiKeysModule, NotificationsModule, forwardRef(() => WebhooksModule)],
  controllers: [ClerkWebhooksController],
  providers: [ClerkWebhooksService, OrgBootstrapService],
  exports: [OrgBootstrapService],
})
export class ClerkWebhooksModule {}
