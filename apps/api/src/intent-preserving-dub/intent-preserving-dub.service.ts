import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TranslateService } from '../translate/translate.service';
import {
  intentPreservingDubCatalog,
  intentPreservingDubHonesty,
} from './intent-preserving-dub.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';

const PROFILES = [
  { id: 'joke-timing', name: 'Joke timing', dims: ['setup', 'punchline_delay', 'laughter_space'] },
  { id: 'insult-severity', name: 'Insult severity', dims: ['directness', 'honorific_break', 'repair'] },
  { id: 'prayer-register', name: 'Prayer register', dims: ['sacred_lexicon', 'prosody', 'taboo_avoidance'] },
  { id: 'gender-norms', name: 'Gender norms', dims: ['address_forms', 'agency', 'politeness'] },
  { id: 'power-distance', name: 'Power distance', dims: ['titles', 'indirectness', 'deference'] },
];

@Injectable()
export class IntentPreservingDubService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly translate: TranslateService,
  ) {}

  engine() {
    return {
      ...intentPreservingDubCatalog(),
      safety: intentPreservingDubHonesty(),
      profiles: PROFILES.length,
    };
  }

  profiles() {
    return { profiles: PROFILES, count: PROFILES.length };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: { organizationId, createdAt: { gte: since }, action: { contains: 'intent-preserving' } },
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
      profiles: this.profiles(),
      activity: await this.activity(session.organizationId),
      links: { self: '/intent-preserving-dub', docs: '/docs/INTENT_PRESERVING_DUB.md' },
    };
  }

  monitoring() {
    return { status: 'ready', honesty: intentPreservingDubHonesty() };
  }

  private analyzeText(text: string) {
    const lower = text.toLowerCase();
    const signals = {
      joke: /(haha|😂|joke|punch|laugh|😂|mzaha)/i.test(text),
      insult: /(fool|idiot|mwizi|stupid|insult)/i.test(lower),
      prayer: /(amen|inshallah|allah|mungu|pray|du\'?a)/i.test(lower),
      formal: /(sir|madam|honorable|mheshimiwa|votre excellence)/i.test(lower),
      gendered: /\b(he|she|brother|sister|mama|baba)\b/i.test(lower),
    };
    return {
      id: randomUUID(),
      speechActs: [
        signals.joke ? 'humor' : null,
        signals.insult ? 'face_threatening' : null,
        signals.prayer ? 'sacred' : null,
        signals.formal ? 'deferential' : null,
        'informative',
      ].filter(Boolean),
      pragmatics: {
        jokeTimingMs: signals.joke ? 420 : 0,
        insultSeverity: signals.insult ? 0.72 : 0.05,
        prayerRegister: signals.prayer ? 'elevated' : 'secular',
        powerDistance: signals.formal ? 'high' : 'medium',
        genderMarked: signals.gendered,
      },
      optimizeFor: 'social_effect',
    };
  }

  async analyze(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const text = String(body.text ?? '').trim();
    const analysis = this.analyzeText(text || 'Mheshimiwa, inshallah the market price will drop — haha!');
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'intent-preserving-dub.analyze',
      route: 'POST /v1/intent-preserving-dub/analyze',
      ip,
      metadata: { speechActs: analysis.speechActs } as never,
    });
    return analysis;
  }

  async dub(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const text = String(body.text ?? '').trim();
    const target = String(body.target ?? 'en').trim() || 'en';
    const source = typeof body.source === 'string' ? body.source : 'auto';
    const analysis = this.analyzeText(text);
    const translated = await this.translate.translate({
      text: text || 'Karibu — asante sana.',
      source,
      target,
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      skipReview: true,
    });
    let dubbed = translated.text;
    if (analysis.pragmatics.prayerRegister === 'elevated') {
      dubbed = `${dubbed}`.replace(/\.$/, '') + ' (preserved sacred register)';
    }
    if (analysis.pragmatics.jokeTimingMs) {
      dubbed = `${dubbed} … [beat ${analysis.pragmatics.jokeTimingMs}ms]`;
    }
    if (analysis.pragmatics.powerDistance === 'high') {
      dubbed = dubbed.replace(/^/, '[honorific retained] ');
    }
    const result = {
      id: randomUUID(),
      sourceText: text,
      target,
      literal: translated.text,
      dubbed,
      analysis,
      provider: translated.provider,
      note: 'Optimized for social effect — not BLEU/word overlap.',
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'intent-preserving-dub.dub',
      route: 'POST /v1/intent-preserving-dub/dub',
      ip,
      metadata: { target, id: result.id } as never,
    });
    return result;
  }

  async score(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const source = String(body.sourceText ?? body.source ?? '');
    const dubbed = String(body.dubbed ?? body.targetText ?? '');
    const analysis = this.analyzeText(source);
    const dims = {
      jokeTiming: analysis.pragmatics.jokeTimingMs
        ? dubbed.includes('beat')
          ? 0.9
          : 0.4
        : 0.8,
      insultSeverity: analysis.pragmatics.insultSeverity > 0.5
        ? /fool|idiot|harsh|insult/i.test(dubbed)
          ? 0.85
          : 0.35
        : 0.8,
      prayerRegister:
        analysis.pragmatics.prayerRegister === 'elevated'
          ? /sacred|allah|god|mungu|inshallah|amen/i.test(dubbed)
            ? 0.92
            : 0.3
          : 0.85,
      powerDistance:
        analysis.pragmatics.powerDistance === 'high'
          ? /honorific|sir|madam|mheshimiwa/i.test(dubbed)
            ? 0.9
            : 0.45
          : 0.8,
      genderNorms: analysis.pragmatics.genderMarked ? 0.75 : 0.85,
    };
    const socialEffect =
      Object.values(dims).reduce((a, b) => a + b, 0) / Object.values(dims).length;
    const result = {
      id: randomUUID(),
      socialEffect: Math.round(socialEffect * 1000) / 1000,
      dims,
      wordOverlapProxy: jaccard(source, dubbed),
      verdict: socialEffect >= 0.7 ? 'intent_preserved' : 'needs_revision',
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'intent-preserving-dub.score',
      route: 'POST /v1/intent-preserving-dub/score',
      ip,
      metadata: { socialEffect: result.socialEffect, verdict: result.verdict } as never,
    });
    return result;
  }
}

function jaccard(a: string, b: string) {
  const A = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const B = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (!A.size && !B.size) return 1;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return Math.round((inter / (A.size + B.size - inter || 1)) * 1000) / 1000;
}
