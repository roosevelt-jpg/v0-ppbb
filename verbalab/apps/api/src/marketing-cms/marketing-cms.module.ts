import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { MarketingCmsController } from './marketing-cms.controller';
import { MarketingCmsService } from './marketing-cms.service';

@Module({
  imports: [IdentityModule, AuditCoreModule],
  controllers: [MarketingCmsController],
  providers: [MarketingCmsService],
  exports: [MarketingCmsService],
})
export class MarketingCmsModule {}
