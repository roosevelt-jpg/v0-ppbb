import { Module } from '@nestjs/common';
import { AfricaEvalMatrixController } from './africa-eval-matrix.controller';
import { AfricaEvalMatrixService } from './africa-eval-matrix.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule],
  controllers: [AfricaEvalMatrixController],
  providers: [AfricaEvalMatrixService],
  exports: [AfricaEvalMatrixService],
})
export class AfricaEvalMatrixModule {}
