import { Injectable } from '@nestjs/common';
import { EnterpriseAssessmentPlatformService } from '../enterprise-assessment-platform.service';
import {
  EnterpriseAssessmentPlatformCatalogPort,
  EnterpriseAssessmentPlatformEngineBundle,
  EnterpriseAssessmentPlatformProductRow,
} from './ports';

@Injectable()
export class NestEnterpriseAssessmentPlatformCatalogAdapter implements EnterpriseAssessmentPlatformCatalogPort {
  constructor(private readonly service: EnterpriseAssessmentPlatformService) {}

  engine(): EnterpriseAssessmentPlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): EnterpriseAssessmentPlatformProductRow[] {
    const bundle = this.engine() as { products?: EnterpriseAssessmentPlatformProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/enterprise-assessment-platform',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'enterprise-assessment-platform',
      name: 'Enterprise Assessment Platform',
      status: 'shipped',
      api: 'GET /v1/enterprise-assessment-platform/engine',
      console: '/enterprise-assessment-platform',
      notes: 'VL-369 shipped.',
    }];
  }
}
