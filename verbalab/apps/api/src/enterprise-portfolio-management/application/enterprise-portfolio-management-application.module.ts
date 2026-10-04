import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EnterprisePortfolioManagementModule } from '../enterprise-portfolio-management.module';
import { ENTERPRISE_PORTFOLIO_MANAGEMENT_CATALOG_PORT } from './ports';
import { NestEnterprisePortfolioManagementCatalogAdapter } from './nest-enterprise-portfolio-management.adapter';
import { ENTERPRISE_PORTFOLIO_MANAGEMENT_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, EnterprisePortfolioManagementModule],
  providers: [
    NestEnterprisePortfolioManagementCatalogAdapter,
    { provide: ENTERPRISE_PORTFOLIO_MANAGEMENT_CATALOG_PORT, useExisting: NestEnterprisePortfolioManagementCatalogAdapter },
    ...ENTERPRISE_PORTFOLIO_MANAGEMENT_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class EnterprisePortfolioManagementApplicationModule {}
