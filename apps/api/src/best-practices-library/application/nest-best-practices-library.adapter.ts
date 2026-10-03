import { Injectable } from '@nestjs/common';
import { BestPracticesLibraryService } from '../best-practices-library.service';
import {
  BestPracticesLibraryCatalogPort,
  BestPracticesLibraryEngineBundle,
  BestPracticesLibraryProductRow,
} from './ports';

@Injectable()
export class NestBestPracticesLibraryCatalogAdapter implements BestPracticesLibraryCatalogPort {
  constructor(private readonly service: BestPracticesLibraryService) {}

  engine(): BestPracticesLibraryEngineBundle {
    return this.service.engine();
  }

  listProducts(): BestPracticesLibraryProductRow[] {
    const bundle = this.engine() as { products?: BestPracticesLibraryProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/best-practices-library',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'best-practices-library',
      name: 'Best Practices Library',
      status: 'shipped',
      api: 'GET /v1/best-practices-library/engine',
      console: '/best-practices-library',
      notes: 'VL-368 shipped.',
    }];
  }
}
