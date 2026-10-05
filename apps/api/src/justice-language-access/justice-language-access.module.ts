import { Module } from '@nestjs/common';
import { JusticeLanguageAccessController } from './justice-language-access.controller';
import { JusticeLanguageAccessService } from './justice-language-access.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateModule } from '../translate/translate.module';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule, TranslateModule],
  controllers: [JusticeLanguageAccessController],
  providers: [JusticeLanguageAccessService],
  exports: [JusticeLanguageAccessService],
})
export class JusticeLanguageAccessModule {}
