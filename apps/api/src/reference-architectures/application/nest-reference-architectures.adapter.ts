import { Injectable } from '@nestjs/common';
import { ReferenceArchitecturesService } from '../reference-architectures.service';
import {
  ReferenceArchitecturesCatalogPort,
  ReferenceArchitecturesEngineBundle,
  ReferenceArchitecturesProductRow,
} from './ports';

@Injectable()
export class NestReferenceArchitecturesCatalogAdapter implements ReferenceArchitecturesCatalogPort {
  constructor(private readonly service: ReferenceArchitecturesService) {}

  engine(): ReferenceArchitecturesEngineBundle {
    return this.service.engine();
  }

  listProducts(): ReferenceArchitecturesProductRow[] {
    const bundle = this.engine() as { products?: ReferenceArchitecturesProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/reference-architectures',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'reference-architectures',
      name: 'Reference Architectures',
      status: 'shipped',
      api: 'GET /v1/reference-architectures/engine',
      console: '/reference-architectures',
      notes: 'shipped.',
    }];
  }
}
