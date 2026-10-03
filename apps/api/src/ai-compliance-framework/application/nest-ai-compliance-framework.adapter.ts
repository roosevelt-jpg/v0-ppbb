import { Injectable } from '@nestjs/common';
import { AiComplianceFrameworkService } from '../ai-compliance-framework.service';
import {
  AiComplianceFrameworkCatalogPort,
  AiComplianceFrameworkEngineBundle,
  AiComplianceFrameworkProductRow,
} from './ports';

@Injectable()
export class NestAiComplianceFrameworkCatalogAdapter implements AiComplianceFrameworkCatalogPort {
  constructor(private readonly service: AiComplianceFrameworkService) {}

  engine(): AiComplianceFrameworkEngineBundle {
    return this.service.engine();
  }

  listProducts(): AiComplianceFrameworkProductRow[] {
    const bundle = this.engine() as { products?: AiComplianceFrameworkProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/ai-compliance-framework',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'ai-compliance-framework',
      name: 'AI Compliance Framework',
      status: 'shipped',
      api: 'GET /v1/ai-compliance-framework/engine',
      console: '/ai-compliance-framework',
      notes: 'shipped.',
    }];
  }
}
