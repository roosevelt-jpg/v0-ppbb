import { Injectable } from '@nestjs/common';
import { WorldLanguageRegistryService } from '../world-language-registry.service';
import {
  WorldLanguageRegistryCatalogPort,
  WorldLanguageRegistryEngineBundle,
  WorldLanguageRegistryProductRow,
} from './ports';

@Injectable()
export class NestWorldLanguageRegistryCatalogAdapter implements WorldLanguageRegistryCatalogPort {
  constructor(private readonly service: WorldLanguageRegistryService) {}

  engine(): WorldLanguageRegistryEngineBundle {
    return this.service.engine();
  }

  listProducts(): WorldLanguageRegistryProductRow[] {
    const bundle = this.engine() as {
      products?: WorldLanguageRegistryProductRow[];
      capabilities?: WorldLanguageRegistryProductRow[];
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/world-language-registry`,
        notes: (c as { notes?: string }).notes ?? '',
      }));
    }
    return [
      {
        id: 'world-language-registry',
        name: 'World Language Registry',
        status: 'shipped',
        api: 'GET /v1/world-language-registry/engine',
        console: '/world-language-registry',
        notes: 'shipped.',
      },
    ];
  }
}
