import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  libraryReferenceProducts,
  libraryReferenceRiskAreas,
  libraryReferenceSummary,
  libraryReferenceVision,
  libraryReferenceVolumes,
} from './library-reference.catalog';
import { libraryReferenceHonesty } from './library-reference.honesty';

@Injectable()
export class LibraryReferenceService {
  private docsRoot() {
    // src/library-reference or dist/library-reference → repo docs/library-reference
    return join(__dirname, '../../../../docs/library-reference');
  }

  products() {
    return {
      product: 'VerbaLab Library Reference',
      products: libraryReferenceProducts(),
      summary: libraryReferenceSummary(),
      honesty: libraryReferenceHonesty(),
      docs: '/docs/library-reference/README.md',
      note: 'Library reference pack — index/risks/vision. Not a new executable volume.',
    };
  }

  index(volume?: number) {
    const volumes = libraryReferenceVolumes();
    const filtered = volume == null ? volumes : volumes.filter((v) => v.volume === volume);
    return {
      product: 'VerbaLab Master Phase Index',
      summary: libraryReferenceSummary(),
      volumes: filtered,
      honesty: libraryReferenceHonesty(),
      docs: '/docs/library-reference/MASTER_PHASE_INDEX.md',
      note: 'v2.0 Volumes 1–24. Index only — pasteable prompts live in per-volume roadmaps.',
    };
  }

  risks() {
    return {
      product: 'VerbaLab Deeper Risk Notes',
      areas: libraryReferenceRiskAreas(),
      honesty: libraryReferenceHonesty(),
      pattern:
        'Software is worth building; connecting it to real legal/financial/safety consequences needs a human decision (often outside expertise).',
      docs: '/docs/library-reference/DEEPER_RISK_NOTES.md',
      note: 'Five flagged areas across Volumes 11, 12, 17, 23, 24.',
    };
  }

  vision() {
    return libraryReferenceVision();
  }

  document(slug: 'master-phase-index' | 'deeper-risk-notes' | 'ai-internet-and-beyond') {
    const map = {
      'master-phase-index': 'MASTER_PHASE_INDEX.md',
      'deeper-risk-notes': 'DEEPER_RISK_NOTES.md',
      'ai-internet-and-beyond': 'AI_INTERNET_AND_BEYOND_RAW.md',
    } as const;
    const file = map[slug];
    const path = join(this.docsRoot(), file);
    const markdown = readFileSync(path, 'utf8');
    return {
      slug,
      file,
      markdown,
      honesty: libraryReferenceHonesty(),
      note:
        slug === 'ai-internet-and-beyond'
          ? 'Raw vision text — not executable phases.'
          : 'Library reference document.',
    };
  }

  monitoring() {
    const summary = libraryReferenceSummary();
    return {
      mode: 'reference',
      summary,
      products: libraryReferenceProducts().map((p) => ({ id: p.id, status: p.status })),
      honesty: libraryReferenceHonesty(),
      note: 'Library reference monitoring snapshot.',
    };
  }
}
