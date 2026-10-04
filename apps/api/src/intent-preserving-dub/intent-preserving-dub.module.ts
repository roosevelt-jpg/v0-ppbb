import { Module } from '@nestjs/common';
import { IntentPreservingDubController } from './intent-preserving-dub.controller';
import { IntentPreservingDubService } from './intent-preserving-dub.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateModule } from '../translate/translate.module';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule, TranslateModule],
  controllers: [IntentPreservingDubController],
  providers: [IntentPreservingDubService],
  exports: [IntentPreservingDubService],
})
export class IntentPreservingDubModule {}
