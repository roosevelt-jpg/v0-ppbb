import { Injectable } from '@nestjs/common';
import { BusinessArchitectureService } from '../business-architecture.service';
import {
  BusinessArchitectureCatalogPort,
  BusinessArchitectureEngineBundle,
  BusinessArchitectureProductRow,
} from './ports';

@Injectable()
export class NestBusinessArchitectureCatalogAdapter implements BusinessArchitectureCatalogPort {
  constructor(private readonly service: BusinessArchitectureService) {}

  engine(): BusinessArchitectureEngineBundle {
    return this.service.engine();
  }

  listProducts(): BusinessArchitectureProductRow[] {
    const bundle = this.engine() as { products?: BusinessArchitectureProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/business-architecture',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'business-architecture',
      name: 'Business Architecture',
      status: 'shipped',
      api: 'GET /v1/business-architecture/engine',
      console: '/business-architecture',
      notes: 'VL-358 shipped.',
    }];
  }
}
