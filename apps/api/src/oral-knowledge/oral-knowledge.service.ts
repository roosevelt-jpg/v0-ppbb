import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  oralKnowledgeCatalog,
  oralKnowledgeHonesty,
} from './oral-knowledge.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';

type OralItem = {
  id: string;
  organizationId: string;
  collection: string;
  title: string;
  transcript: string;
  sourceKind: 'radio' | 'whatsapp' | 'market' | 'elder' | 'other';
  speakerConsent: boolean;
  dialect?: string;
  recordedAt?: string;
  citations: number;
  createdAt: string;
};

@Injectable()
export class OralKnowledgeService {
  private readonly items = new Map<string, OralItem>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return {
      ...oralKnowledgeCatalog(),
      safety: oralKnowledgeHonesty(),
      items: this.items.size,
    };
  }

  collections() {
    const by = new Map<string, number>();
    for (const item of this.items.values()) {
      by.set(item.collection, (by.get(item.collection) ?? 0) + 1);
    }
    return {
      collections: [...by.entries()].map(([name, count]) => ({ name, count })),
      defaults: ['elders', 'radio', 'markets', 'whatsapp-notes'],
    };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: { organizationId, createdAt: { gte: since }, action: { contains: 'oral-knowledge' } },
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
    const rows = [...this.items.values()].filter((i) => i.organizationId === session.organizationId);
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine: this.engine(),
      collections: this.collections(),
      recent: rows.slice(-10).reverse(),
      activity: await this.activity(session.organizationId),
      links: { self: '/oral-knowledge', docs: '/docs/ORAL_KNOWLEDGE.md' },
    };
  }

  monitoring() {
    return { status: 'ready', honesty: oralKnowledgeHonesty() };
  }

  async ingest(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const transcript = String(body.transcript ?? body.text ?? '').trim();
    if (!transcript) {
      throw new ApiException('validation_error', 'transcript or text is required', HttpStatus.BAD_REQUEST);
    }
    if (body.speakerConsent !== true && body.speakerConsent !== 'true') {
      throw new ApiException(
        'validation_error',
        'speakerConsent must be true for oral ingest',
        HttpStatus.BAD_REQUEST,
      );
    }
    const item: OralItem = {
      id: randomUUID(),
      organizationId: session.organizationId,
      collection: String(body.collection ?? 'elders').trim() || 'elders',
      title: String(body.title ?? transcript.slice(0, 48)).trim(),
      transcript,
      sourceKind: (String(body.sourceKind ?? 'other') as OralItem['sourceKind']) || 'other',
      speakerConsent: true,
      dialect: body.dialect ? String(body.dialect) : undefined,
      recordedAt: body.recordedAt ? String(body.recordedAt) : new Date().toISOString(),
      citations: 0,
      createdAt: new Date().toISOString(),
    };
    this.items.set(item.id, item);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'oral-knowledge.ingest',
      route: 'POST /v1/oral-knowledge/ingest',
      ip,
      metadata: { itemId: item.id, collection: item.collection, sourceKind: item.sourceKind } as never,
    });
    return { item };
  }

  async cite(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const itemId = String(body.itemId ?? '');
    const item = this.items.get(itemId);
    if (!item || item.organizationId !== session.organizationId) {
      throw new ApiException('not_found', 'oral item not found', HttpStatus.NOT_FOUND);
    }
    item.citations += 1;
    this.items.set(itemId, item);
    const citation = {
      id: randomUUID(),
      itemId: item.id,
      title: item.title,
      sourceKind: item.sourceKind,
      dialect: item.dialect ?? null,
      recordedAt: item.recordedAt ?? null,
      speakerConsent: item.speakerConsent,
      excerpt: item.transcript.slice(0, 240),
      pointer: `oral://${item.collection}/${item.id}#t0`,
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'oral-knowledge.cite',
      route: 'POST /v1/oral-knowledge/cite',
      ip,
      metadata: { itemId, citationId: citation.id } as never,
    });
    return { citation, item };
  }

  async query(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const question = String(body.question ?? body.q ?? '').trim().toLowerCase();
    const orgItems = [...this.items.values()].filter((i) => i.organizationId === session.organizationId);
    const scored = orgItems
      .map((item) => {
        const hay = `${item.title} ${item.transcript}`.toLowerCase();
        const terms = question.split(/\s+/).filter(Boolean);
        const hits = terms.filter((t) => hay.includes(t)).length;
        return { item, score: hits + (hay.includes(question) ? 2 : 0) };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    const answer =
      scored.length === 0
        ? 'No consented oral sources match yet — ingest radio, voice notes, or elder speech first.'
        : `From oral sources: ${scored
            .map((s) => s.item.transcript.slice(0, 160))
            .join(' … ')}`;
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'oral-knowledge.query',
      route: 'POST /v1/oral-knowledge/query',
      ip,
      metadata: { hits: scored.length } as never,
    });
    return {
      question: String(body.question ?? body.q ?? ''),
      answer,
      citations: scored.map((s) => ({
        itemId: s.item.id,
        title: s.item.title,
        pointer: `oral://${s.item.collection}/${s.item.id}`,
        score: s.score,
      })),
    };
  }
}
