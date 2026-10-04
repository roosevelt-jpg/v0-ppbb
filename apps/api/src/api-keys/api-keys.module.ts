import { Module, forwardRef } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { IdentityModule } from '../identity/identity.module';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { AuditCoreModule } from '../audit/audit-core.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [IdentityModule, AuditCoreModule, forwardRef(() => WebhooksModule)],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyGuard],
  exports: [ApiKeysService, ApiKeyGuard],
})
export class ApiKeysModule {}
