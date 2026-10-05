import { Module, forwardRef } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { TranslateModule } from '../translate/translate.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { DocumentsModule } from '../documents/documents.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { VideoVoiceModule } from '../video-voice/video-voice.module';
import { VoiceClonesModule } from '../voice-clones/voice-clones.module';

@Module({
  imports: [
    TranslateModule,
    ApiKeysModule,
    IdentityModule,
    AuditCoreModule,
    forwardRef(() => DocumentsModule),
    NotificationsModule,
    forwardRef(() => WorkflowsModule),
    WebhooksModule,
    VideoVoiceModule,
    VoiceClonesModule,
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService, WebhooksModule],
})
export class JobsModule {}
