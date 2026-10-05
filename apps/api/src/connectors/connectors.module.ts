import { Module, forwardRef } from '@nestjs/common';
import { SlackConnectorController } from './slack.controller';
import { SlackConnectorService } from './slack.service';
import { ConnectorsController } from './connectors.controller';
import { ConnectorsService } from './connectors.service';
import { TranslateModule } from '../translate/translate.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { JobsModule } from '../jobs/jobs.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TranslateModule,
    IdentityModule,
    AuditCoreModule,
    forwardRef(() => JobsModule),
    NotificationsModule,
  ],
  controllers: [ConnectorsController, SlackConnectorController],
  providers: [ConnectorsService, SlackConnectorService],
  exports: [ConnectorsService, SlackConnectorService],
})
export class ConnectorsModule {}
