import { Injectable } from '@nestjs/common';
import { StandardsAnalyticsService } from '../standards-analytics.service';
import {
  StandardsAnalyticsCatalogPort,
  StandardsAnalyticsEngineBundle,
  StandardsAnalyticsProductRow,
} from './ports';

@Injectable()
export class NestStandardsAnalyticsCatalogAdapter implements StandardsAnalyticsCatalogPort {
  constructor(private readonly service: StandardsAnalyticsService) {}

  engine(): StandardsAnalyticsEngineBundle {
    return this.service.engine();
  }

  listProducts(): StandardsAnalyticsProductRow[] {
    const bundle = this.engine() as { products?: StandardsAnalyticsProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/standards-analytics',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'standards-analytics',
      name: 'Standards Analytics',
      status: 'shipped',
      api: 'GET /v1/standards-analytics/engine',
      console: '/standards-analytics',
      notes: 'VL-372 shipped.',
    }];
  }
}
