import { Injectable } from '@nestjs/common';
import { GlobalPartnerProgramService } from '../global-partner-program.service';
import {
  GlobalPartnerProgramCatalogPort,
  GlobalPartnerProgramEngineBundle,
  GlobalPartnerProgramProductRow,
} from './ports';

@Injectable()
export class NestGlobalPartnerProgramCatalogAdapter implements GlobalPartnerProgramCatalogPort {
  constructor(private readonly service: GlobalPartnerProgramService) {}

  engine(): GlobalPartnerProgramEngineBundle {
    return this.service.engine();
  }

  listProducts(): GlobalPartnerProgramProductRow[] {
    const bundle = this.engine() as { products?: GlobalPartnerProgramProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/global-partner-program',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'global-partner-program',
      name: 'Global Partner Program',
      status: 'shipped',
      api: 'GET /v1/global-partner-program/engine',
      console: '/global-partner-program',
      notes: 'VL-371 shipped.',
    }];
  }
}
