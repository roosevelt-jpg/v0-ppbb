import { Injectable } from '@nestjs/common';
import { AiCertificationPlatformService } from '../ai-certification-platform.service';
import {
  AiCertificationPlatformCatalogPort,
  AiCertificationPlatformEngineBundle,
  AiCertificationPlatformProductRow,
} from './ports';

@Injectable()
export class NestAiCertificationPlatformCatalogAdapter implements AiCertificationPlatformCatalogPort {
  constructor(private readonly service: AiCertificationPlatformService) {}

  engine(): AiCertificationPlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): AiCertificationPlatformProductRow[] {
    const bundle = this.engine() as { products?: AiCertificationPlatformProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/ai-certification-platform',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'ai-certification-platform',
      name: 'AI Certification Platform',
      status: 'shipped',
      api: 'GET /v1/ai-certification-platform/engine',
      console: '/ai-certification-platform',
      notes: 'VL-365 shipped.',
    }];
  }
}
