import { Injectable } from '@nestjs/common';
import { GlobalAiStandardsService } from '../global-ai-standards.service';
import {
  GlobalAiStandardsCatalogPort,
  GlobalAiStandardsEngineBundle,
  GlobalAiStandardsProductRow,
} from './ports';

@Injectable()
export class NestGlobalAiStandardsCatalogAdapter implements GlobalAiStandardsCatalogPort {
  constructor(private readonly service: GlobalAiStandardsService) {}

  engine(): GlobalAiStandardsEngineBundle {
    return this.service.products();
  }

  listProducts(): GlobalAiStandardsProductRow[] {
    const bundle = this.engine() as { products?: GlobalAiStandardsProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/global-ai-standards',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'global-ai-standards',
      name: 'Global AI Standards',
      status: 'shipped',
      api: 'GET /v1/global-ai-standards/products',
      console: '/global-ai-standards',
      notes: 'shipped.',
    }];
  }
}
