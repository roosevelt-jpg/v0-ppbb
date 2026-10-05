import { Injectable } from '@nestjs/common';
import {
  worldLanguageRegistryEngineCatalog,
  worldLanguageSeed,
  worldLanguageFamilies,
} from './world-language-registry.catalog';

@Injectable()
export class WorldLanguageRegistryService {
  engine() {
    return worldLanguageRegistryEngineCatalog();
  }

  languages(query?: string) {
    const q = (query ?? '').trim().toLowerCase();
    const languages = worldLanguageSeed().filter((l) => {
      if (!q) return true;
      return (
        l.code.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.family.toLowerCase().includes(q)
      );
    });
    return {
      languages,
      count: languages.length,
      coverageComplete: false,
      honesty: this.engine().honesty,
      docs: '/docs/WORLD_LANGUAGE_REGISTRY.md',
    };
  }

  families() {
    return {
      families: worldLanguageFamilies(),
      coverageComplete: false,
      honesty: this.engine().honesty,
    };
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'registry',
      languageCount: catalog.languages.length,
      honesty: catalog.honesty,
      note: 'World Language Registry monitoring snapshot.',
    };
  }
}
