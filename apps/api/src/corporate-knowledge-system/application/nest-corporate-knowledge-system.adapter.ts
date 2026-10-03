import { Injectable } from '@nestjs/common';
import { CorporateKnowledgeSystemService } from '../corporate-knowledge-system.service';
import {
  CorporateKnowledgeSystemCatalogPort,
  CorporateKnowledgeSystemEngineBundle,
  CorporateKnowledgeSystemProductRow,
} from './ports';

@Injectable()
export class NestCorporateKnowledgeSystemCatalogAdapter implements CorporateKnowledgeSystemCatalogPort {
  constructor(private readonly service: CorporateKnowledgeSystemService) {}

  engine(): CorporateKnowledgeSystemEngineBundle {
    return this.service.engine();
  }

  listProducts(): CorporateKnowledgeSystemProductRow[] {
    const bundle = this.engine() as { products?: CorporateKnowledgeSystemProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/corporate-knowledge-system',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'corporate-knowledge-system',
      name: 'Corporate Knowledge System',
      status: 'shipped',
      api: 'GET /v1/corporate-knowledge-system/engine',
      console: '/corporate-knowledge-system',
      notes: 'VL-360 shipped.',
    }];
  }
}
