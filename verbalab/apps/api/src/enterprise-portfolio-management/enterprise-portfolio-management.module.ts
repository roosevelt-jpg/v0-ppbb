import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VcosStoreModule } from '../vcos-store/vcos-store.module';
import { EnterprisePortfolioManagementController } from './enterprise-portfolio-management.controller';
import { EnterprisePortfolioManagementService } from './enterprise-portfolio-management.service';

@Module({
  imports: [IdentityModule, VcosStoreModule],
  controllers: [EnterprisePortfolioManagementController],
  providers: [EnterprisePortfolioManagementService],
  exports: [EnterprisePortfolioManagementService],
})
export class EnterprisePortfolioManagementModule {}
