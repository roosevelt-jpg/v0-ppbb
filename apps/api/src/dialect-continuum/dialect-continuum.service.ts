import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  dialectContinuumCatalog,
  dialectContinuumHonesty,
} from './dialect-continuum.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';

type SpectrumPoint = {
  code: string;
  name: string;
  weight: number;
  cues: string[];
};

const CONTINUUM_MAP = [
  {
    id: 'maghreb-arabic',
    name: 'Maghrebi Arabic continuum',
    poles: ['ary', 'arq', 'aeb', 'ayl', 'mey', 'ar'],
    notes: 'Darija ↔ Tunisian ↔ Libyan ↔ Hassaniya ↔ MSA drift.',
  },
  {
    id: 'wa-pidgin',
    name: 'West African Pidgin continuum',
    poles: ['pcm', 'en', 'yo', 'ha'],
    notes: 'Nigerian Pidgin ↔ English ↔ Yoruba/Hausa code-switch.',
  },
  {
    id: 'sheng-sw',
    name: 'Sheng / Swahili urban continuum',
    poles: ['sw', 'en', 'sheng'],
    notes: 'Nairobi Sheng mixes Swahili + English slang mid-turn.',
  },
  {
    id: 'maghreb-french',
    name: 'Maghrebi French continuum',
    poles: ['fr-MA', 'fr-DZ', 'fr-TN', 'fr', 'ary'],
    notes: 'Street French with Darija loanwords and register shifts.',
  },
  {
    id: 'hinglish',
    name: 'Hinglish continuum',
    poles: ['hi', 'en', 'hi-in', 'en-in'],
    notes: 'Hindi ↔ Indian English code-switch mid-turn.',
  },
  {
    id: 'taglish',
    name: 'Taglish continuum',
    poles: ['tl', 'en', 'tl-ph', 'en-ph'],
    notes: 'Tagalog ↔ Philippine English with po/opo respect markers.',
  },
  {
    id: 'spanglish-carib',
    name: 'Caribbean / LatAm Spanglish continuum',
    poles: ['es', 'en', 'es-pr', 'es-do', 'es-mx'],
    notes: 'Spanish ↔ English code-switch across Caribbean and US-LatAm speech.',
  },
  {
    id: 'haitian-continuum',
    name: 'Haitian Kreyol–French continuum',
    poles: ['ht', 'fr', 'ht-ht'],
    notes: 'Kreyol everyday register ↔ French formal/legal register.',
  },
  {
    id: 'jamaica-continuum',
    name: 'Jamaican English–Patwa continuum',
    poles: ['en', 'jam', 'en-jm', 'jam-jm'],
    notes: 'Standard Jamaican English ↔ Patwa street register.',
  },
];

@Injectable()
export class DialectContinuumService {
  private readonly tracks = new Map<string, Record<string, unknown>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return {
      ...dialectContinuumCatalog(),
      safety: dialectContinuumHonesty(),
      continuumCount: CONTINUUM_MAP.length,
      activeTracks: this.tracks.size,
    };
  }

  map() {
    return { continua: CONTINUUM_MAP, count: CONTINUUM_MAP.length };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: { organizationId, createdAt: { gte: since }, action: { contains: 'dialect-continuum' } },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, action: true, createdAt: true },
    });
    return {
      window: '7d',
      count: rows.length,
      events: rows.map((r) => ({ id: r.id, action: r.action, at: r.createdAt.toISOString() })),
    };
  }

  async overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine: this.engine(),
      map: this.map(),
      activity: await this.activity(session.organizationId),
      links: { self: '/dialect-continuum', docs: '/docs/DIALECT_CONTINUUM.md' },
    };
  }

  monitoring() {
    return { status: 'ready', honesty: dialectContinuumHonesty() };
  }

  private scoreText(text: string): SpectrumPoint[] {
    const lower = text.toLowerCase();
    const points: SpectrumPoint[] = [];
    const push = (code: string, name: string, cues: string[], base = 0.15) => {
      const hits = cues.filter((c) => lower.includes(c));
      if (hits.length || base > 0.2) {
        points.push({
          code,
          name,
          weight: Math.min(0.95, base + hits.length * 0.18),
          cues: hits,
        });
      }
    };
    push('ary', 'Moroccan Darija', ['wakha', 'bghit', 'safi', 'zwin', 'labas'], 0.12);
    push('arq', 'Algerian Darija', ['wah', 'yakhi', 'besah', 'chouiya'], 0.1);
    push('aeb', 'Tunisian Arabic', ['bara', 'yezzi', '3asseb', 'chkoun'], 0.1);
    push('pcm', 'Nigerian Pidgin', ['abi', 'dey', 'wetin', 'no wahala', 'how far'], 0.12);
    push('sheng', 'Sheng', ['msee', 'poa', 'noma', 'breeki', 'mbogi'], 0.1);
    push('fr', 'French (Maghrebi street)', ['wesh', 'wallah', 'kifkif', 'ça va'], 0.08);
    push('sw', 'Swahili', ['habari', 'asante', 'karibu', 'sawa'], 0.1);
    push('en', 'English', ['the', 'and', 'you'], 0.05);
    push('ar', 'MSA / formal Arabic', ['من', 'إلى', 'في'], 0.05);
    if (!points.length) {
      points.push({ code: 'und', name: 'Undetermined continuum', weight: 0.4, cues: [] });
    }
    const sum = points.reduce((n, p) => n + p.weight, 0) || 1;
    return points
      .map((p) => ({ ...p, weight: Math.round((p.weight / sum) * 1000) / 1000 }))
      .sort((a, b) => b.weight - a.weight);
  }

  async detect(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const text = String(body.text ?? '').trim();
    const spectrum = this.scoreText(text || 'habari my brother, no wahala');
    const result = {
      id: randomUUID(),
      text,
      spectrum,
      primary: spectrum[0],
      codeSwitch: spectrum.filter((p) => p.weight >= 0.15).length > 1,
      continuumId: continuumFor(spectrum[0]?.code) ?? CONTINUUM_MAP[0]?.id ?? 'maghreb-arabic',
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'dialect-continuum.detect',
      route: 'POST /v1/dialect-continuum/detect',
      ip,
      metadata: { primary: result.primary?.code, codeSwitch: result.codeSwitch } as never,
    });
    return result;
  }

  async track(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const sessionId = String(body.sessionId ?? randomUUID());
    const utterance = String(body.text ?? body.utterance ?? '').trim();
    const spectrum = this.scoreText(utterance);
    const prev = this.tracks.get(sessionId) as
      | { turns?: Array<{ at: string; primary: string; spectrum: SpectrumPoint[] }> }
      | undefined;
    const turns = [...(prev?.turns ?? [])];
    turns.push({ at: new Date().toISOString(), primary: spectrum[0]?.code ?? 'und', spectrum });
    const prevTurn = turns.length > 1 ? turns[turns.length - 2] : undefined;
    const lastTurn = turns[turns.length - 1];
    const drift = Boolean(prevTurn && lastTurn && lastTurn.primary !== prevTurn.primary);
    const row = { sessionId, turns, drift, updatedAt: new Date().toISOString() };
    this.tracks.set(sessionId, row);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'dialect-continuum.track',
      route: 'POST /v1/dialect-continuum/track',
      ip,
      metadata: { sessionId, drift, primary: spectrum[0]?.code } as never,
    });
    return row;
  }

  async reply(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const text = String(body.text ?? body.prompt ?? '').trim();
    const spectrum = this.scoreText(text);
    const mix = spectrum.slice(0, 3);
    const reply =
      mix[0]?.code === 'pcm'
        ? 'I hear you — no wahala. Make we continue for the language wey fit you.'
        : mix[0]?.code === 'sheng'
          ? 'Sawa msee — niko na wewe. Tuendelee kwa lugha unayotumia sasa.'
          : mix[0]?.code === 'ary' || mix[0]?.code === 'arq' || mix[0]?.code === 'aeb'
            ? 'Wakha — fhemtk. Ghadi njawbek b nafs lmazij dyal lughat li kathdar biha.'
            : mix[0]?.code === 'sw'
              ? 'Sawa — nimeelewa. Nitajibu kwa mchanganyiko unaotumia sasa.'
              : 'Understood — I’ll answer in the same dialect mix you just used.';
    const result = {
      id: randomUUID(),
      mix,
      reply,
      policy: 'reply-in-mix',
      note: 'Continuum reply preserves code-switch weights rather than forcing a single ISO code.',
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'dialect-continuum.reply',
      route: 'POST /v1/dialect-continuum/reply',
      ip,
      metadata: { mix: mix.map((m) => m.code) } as never,
    });
    return result;
  }
}

function continuumFor(code?: string) {
  if (!code) return null;
  return CONTINUUM_MAP.find((c) => c.poles.includes(code))?.id ?? null;
}
