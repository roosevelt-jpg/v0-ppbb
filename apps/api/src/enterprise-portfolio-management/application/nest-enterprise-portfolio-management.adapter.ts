import { Injectable } from '@nestjs/common';
import { EnterprisePortfolioManagementService } from '../enterprise-portfolio-management.service';
import {
  EnterprisePortfolioManagementCatalogPort,
  EnterprisePortfolioManagementEngineBundle,
  EnterprisePortfolioManagementProductRow,
} from './ports';

@Injectable()
export class NestEnterprisePortfolioManagementCatalogAdapter implements EnterprisePortfolioManagementCatalogPort {
  constructor(private readonly service: EnterprisePortfolioManagementService) {}

  engine(): EnterprisePortfolioManagementEngineBundle {
    return this.service.engine();
  }

  listProducts(): EnterprisePortfolioManagementProductRow[] {
    const bundle = this.engine() as { products?: EnterprisePortfolioManagementProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/enterprise-portfolio-management',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'enterprise-portfolio-management',
      name: 'Enterprise Portfolio Management',
      status: 'shipped',
      api: 'GET /v1/enterprise-portfolio-management/engine',
      console: '/enterprise-portfolio-management',
      notes: 'shipped.',
    }];
  }
}
