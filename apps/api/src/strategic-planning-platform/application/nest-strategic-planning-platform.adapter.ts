import { Injectable } from '@nestjs/common';
import { StrategicPlanningPlatformService } from '../strategic-planning-platform.service';
import {
  StrategicPlanningPlatformCatalogPort,
  StrategicPlanningPlatformEngineBundle,
  StrategicPlanningPlatformProductRow,
} from './ports';

@Injectable()
export class NestStrategicPlanningPlatformCatalogAdapter implements StrategicPlanningPlatformCatalogPort {
  constructor(private readonly service: StrategicPlanningPlatformService) {}

  engine(): StrategicPlanningPlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): StrategicPlanningPlatformProductRow[] {
    const bundle = this.engine() as { products?: StrategicPlanningPlatformProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/strategic-planning-platform',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'strategic-planning-platform',
      name: 'Strategic Planning Platform',
      status: 'shipped',
      api: 'GET /v1/strategic-planning-platform/engine',
      console: '/strategic-planning-platform',
      notes: 'VL-356 shipped.',
    }];
  }
}
