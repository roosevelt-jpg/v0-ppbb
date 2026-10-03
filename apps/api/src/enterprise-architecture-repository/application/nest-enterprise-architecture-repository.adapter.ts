import { Injectable } from '@nestjs/common';
import { EnterpriseArchitectureRepositoryService } from '../enterprise-architecture-repository.service';
import {
  EnterpriseArchitectureRepositoryCatalogPort,
  EnterpriseArchitectureRepositoryEngineBundle,
  EnterpriseArchitectureRepositoryProductRow,
} from './ports';

@Injectable()
export class NestEnterpriseArchitectureRepositoryCatalogAdapter implements EnterpriseArchitectureRepositoryCatalogPort {
  constructor(private readonly service: EnterpriseArchitectureRepositoryService) {}

  engine(): EnterpriseArchitectureRepositoryEngineBundle {
    return this.service.engine();
  }

  listProducts(): EnterpriseArchitectureRepositoryProductRow[] {
    const bundle = this.engine() as { products?: EnterpriseArchitectureRepositoryProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/enterprise-architecture-repository',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'enterprise-architecture-repository',
      name: 'Enterprise Architecture Repository',
      status: 'shipped',
      api: 'GET /v1/enterprise-architecture-repository/engine',
      console: '/enterprise-architecture-repository',
      notes: 'VL-359 shipped.',
    }];
  }
}
