import { Module } from '@nestjs/common';
import { AiInternetAuditController } from './ai-internet-audit.controller';
import { AiInternetAuditService } from './ai-internet-audit.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [AiInternetAuditController],
  providers: [AiInternetAuditService],
})
export class AiInternetAuditModule {}
