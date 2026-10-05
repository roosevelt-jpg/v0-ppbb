import { Module } from '@nestjs/common';
import { ModelEconomyController } from './model-economy.controller';
import { ModelEconomyService } from './model-economy.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule],
  controllers: [ModelEconomyController],
  providers: [ModelEconomyService],
  exports: [ModelEconomyService],
})
export class ModelEconomyModule {}
