import { Module } from '@nestjs/common';
import { OralKnowledgeController } from './oral-knowledge.controller';
import { OralKnowledgeService } from './oral-knowledge.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule],
  controllers: [OralKnowledgeController],
  providers: [OralKnowledgeService],
  exports: [OralKnowledgeService],
})
export class OralKnowledgeModule {}
