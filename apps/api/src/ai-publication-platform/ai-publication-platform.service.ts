import { Injectable } from '@nestjs/common';
import { aiPublicationPlatformEngineCatalog } from './ai-publication-platform.catalog';

@Injectable()
export class AiPublicationPlatformService {
  engine() {
    return aiPublicationPlatformEngineCatalog();
  }

  publications(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const publications = catalog.publications.filter((p) => {
      if (!q) return true;
      return (
        p.id.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.kind.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q)
      );
    });
    return {
      publications,
      count: publications.length,
      honesty: catalog.honesty,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.publications(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'publication',
      publicationCount: catalog.publications.length,
      honesty: catalog.honesty,
      note: 'AI Publication Platform monitoring snapshot.',
    };
  }


  assignDoi(input: { publicationId?: string; title?: string }) {
    const id = (input.publicationId ?? 'pub-sandbox').slice(0, 64);
    const slug = (input.title ?? id)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'item';
    const doi = `10.sandbox/verbalab.${slug}.${Date.now().toString(36)}`;
    return {
      publicationId: id,
      doi,
      registered: false,
      honesty: { doiRegistryOs: false, stubAssignment: true },
      note: 'Sandbox DOI stub assignment. Not a DOI registry OS.',
    };
  }
}
