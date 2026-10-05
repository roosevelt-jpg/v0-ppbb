
import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { createVerbalabMt } from '../gateway/verbalab-own-ai';
import {
  mutualIntelligibilityCatalog,
  mutualIntelligibilityHonesty,
} from './mutual-intelligibility.catalog';

type Corridor = {
  id: string;
  name: string;
  locales: string[];
  note: string;
};

const SEED: Corridor[] = [
  {
    id: 'ecowas',
    name: 'ECOWAS corridor',
    locales: ['en', 'fr', 'ha', 'yo', 'ig', 'ff', 'tw', 'ee'],
    note: 'West Africa trade / health / security mutual intelligibility.',
  },
  {
    id: 'eac',
    name: 'EAC corridor',
    locales: ['sw', 'en', 'rw', 'rn', 'lg', 'luo', 'so'],
    note: 'East Africa corridor — Swahili as regional bridge without English-only hops.',
  },
  {
    id: 'sadc',
    name: 'SADC corridor',
    locales: ['en', 'pt', 'zu', 'xh', 'st', 'tn', 'ny', 'sn'],
    note: 'Southern Africa corridor across Bantu continua + Portuguese/English.',
  },
  {
    id: 'asean',
    name: 'ASEAN corridor',
    locales: ['en', 'th', 'vi', 'tl', 'ms', 'id', 'km', 'lo', 'my', 'jv'],
    note: 'Southeast Asia corridor — regional bridges without English-only hops where packs exist.',
  },
  {
    id: 'saarc',
    name: 'SAARC corridor',
    locales: ['en', 'hi', 'bn', 'ta', 'te', 'ur', 'ne', 'si', 'pa', 'mr'],
    note: 'South Asia corridor across Indic and Dravidian languages + English bridge.',
  },
  {
    id: 'mercosur',
    name: 'Mercosur / Andes corridor',
    locales: ['es', 'pt', 'qu', 'gn', 'ay', 'en'],
    note: 'Latin America corridor — Spanish/Portuguese with Andean and Guarani bridges.',
  },
  {
    id: 'caricom',
    name: 'CARICOM corridor',
    locales: ['en', 'ht', 'jam', 'pap', 'es', 'fr'],
    note: 'Caribbean corridor — English/Creole/Spanish/French mutual intelligibility.',
  },
];

@Injectable()
export class MutualIntelligibilityService {
  private readonly corridors = new Map(SEED.map((c) => [c.id, { ...c, locales: [...c.locales] }]));

  constructor(private readonly audit: AuditService) {}

  engine() {
    return {
      ...mutualIntelligibilityCatalog(),
      safety: mutualIntelligibilityHonesty(),
      corridorCount: this.corridors.size,
    };
  }

  monitoring() {
    return { status: 'ready', honesty: mutualIntelligibilityHonesty() };
  }

  async overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        role: session.role,
      },
      engine: this.engine(),
      corridors: this.listCorridors(),
      links: { self: '/mutual-intelligibility', docs: '/docs/MUTUAL_INTELLIGIBILITY.md' },
    };
  }

  listCorridors() {
    return { corridors: [...this.corridors.values()] };
  }

  async registerLocale(session: SessionContext, corridorId: string, body: Record<string, unknown>, ip?: string) {
    const corridor = this.corridors.get(corridorId);
    if (!corridor) throw new ApiException('not_found', 'Unknown corridor', HttpStatus.NOT_FOUND);
    const locale = String(body.locale ?? '').trim().toLowerCase();
    if (!locale) throw new ApiException('validation_error', 'locale required', HttpStatus.BAD_REQUEST);
    if (!corridor.locales.includes(locale)) corridor.locales.push(locale);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'mutual-intelligibility.locale.register',
      ip,
      metadata: { corridorId, locale },
    });
    return { corridor };
  }

  async bridge(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const corridorId = String(body.corridorId ?? '').trim().toLowerCase();
    const corridor = this.corridors.get(corridorId);
    if (!corridor) throw new ApiException('not_found', 'Unknown corridor', HttpStatus.NOT_FOUND);
    const sourceLocale = String(body.sourceLocale ?? '').trim().toLowerCase();
    const targetLocale = String(body.targetLocale ?? '').trim().toLowerCase();
    const text = String(body.text ?? '').trim();
    if (!sourceLocale || !targetLocale || !text) {
      throw new ApiException('validation_error', 'sourceLocale, targetLocale, text required', HttpStatus.BAD_REQUEST);
    }
    if (!corridor.locales.includes(sourceLocale) || !corridor.locales.includes(targetLocale)) {
      throw new ApiException(
        'locale_not_in_corridor',
        'Locale not registered on this corridor',
        HttpStatus.BAD_REQUEST,
      );
    }
    let bridged = text;
    let path: 'identity' | 'own_ai_corridor' = 'identity';
    let provider = 'identity';
    if (sourceLocale !== targetLocale) {
      const mt = await createVerbalabMt().translate({
        text,
        source: sourceLocale,
        target: targetLocale,
      });
      bridged = mt.text;
      path = 'own_ai_corridor';
      provider = mt.provider ?? 'verbalab_own_ai';
    }
    const result = {
      bridgeId: randomUUID(),
      corridorId,
      sourceLocale,
      targetLocale,
      sourceText: text,
      bridgedText: bridged,
      path,
      provider,
      englishMiddleman: false,
      note: 'Corridor bridge uses VerbaLab Own AI without a mandatory English pivot.',
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'mutual-intelligibility.bridge',
      ip,
      metadata: { bridgeId: result.bridgeId, corridorId, sourceLocale, targetLocale },
    });
    return result;
  }

  score(body: Record<string, unknown>) {
    const sourceLocale = String(body.sourceLocale ?? '').trim().toLowerCase();
    const targetLocale = String(body.targetLocale ?? '').trim().toLowerCase();
    const text = String(body.text ?? '').trim();
    if (!sourceLocale || !targetLocale) {
      throw new ApiException('validation_error', 'sourceLocale and targetLocale required', HttpStatus.BAD_REQUEST);
    }
    const same = sourceLocale === targetLocale;
    const related = sourceLocale.slice(0, 2) === targetLocale.slice(0, 2);
    const score = same ? 1 : related ? 0.72 : 0.48;
    return {
      sourceLocale,
      targetLocale,
      characters: [...text].length,
      intelligibility: score,
      band: score >= 0.85 ? 'high' : score >= 0.6 ? 'medium' : 'assisted',
      recommendation: score >= 0.85 ? 'direct' : 'corridor_bridge',
    };
  }
}
