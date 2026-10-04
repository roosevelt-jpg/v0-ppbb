import { Module } from '@nestjs/common';
import { IndustryDropsController } from './industry-drops.controller';
import { IndustryDropsService } from './industry-drops.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule],
  controllers: [IndustryDropsController],
  providers: [IndustryDropsService],
  exports: [IndustryDropsService],
})
export class IndustryDropsModule {}
