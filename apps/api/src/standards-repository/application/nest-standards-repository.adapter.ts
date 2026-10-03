import { Injectable } from '@nestjs/common';
import { StandardsRepositoryService } from '../standards-repository.service';
import {
  StandardsRepositoryCatalogPort,
  StandardsRepositoryEngineBundle,
  StandardsRepositoryProductRow,
} from './ports';

@Injectable()
export class NestStandardsRepositoryCatalogAdapter implements StandardsRepositoryCatalogPort {
  constructor(private readonly service: StandardsRepositoryService) {}

  engine(): StandardsRepositoryEngineBundle {
    return this.service.engine();
  }

  listProducts(): StandardsRepositoryProductRow[] {
    const bundle = this.engine() as { products?: StandardsRepositoryProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/standards-repository',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'standards-repository',
      name: 'Standards Repository',
      status: 'shipped',
      api: 'GET /v1/standards-repository/engine',
      console: '/standards-repository',
      notes: 'VL-370 shipped.',
    }];
  }
}
