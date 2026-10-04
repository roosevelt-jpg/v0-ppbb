
import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  institutionalVoiceCatalog,
  institutionalVoiceHonesty,
} from './institutional-voice.catalog';

type Agency = {
  id: string;
  organizationId: string;
  name: string;
  voiceId: string;
  createdAt: string;
};

type Doc = {
  id: string;
  organizationId: string;
  agencyId: string;
  title: string;
  body: string;
  hash: string;
  createdAt: string;
};

@Injectable()
export class InstitutionalVoiceService {
  private readonly agencies = new Map<string, Agency>();
  private readonly docs: Doc[] = [];

  constructor(private readonly audit: AuditService) {}

  engine() {
    return {
      ...institutionalVoiceCatalog(),
      safety: institutionalVoiceHonesty(),
      agencies: [...this.agencies.values()].length,
      corpusDocs: this.docs.length,
    };
  }

  monitoring() {
    return { status: 'ready', honesty: institutionalVoiceHonesty() };
  }

  async overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        role: session.role,
      },
      engine: this.engine(),
      agencies: [...this.agencies.values()].filter((a) => a.organizationId === session.organizationId),
      corpus: this.listCorpus(session.organizationId),
      links: { self: '/institutional-voice', docs: '/docs/INSTITUTIONAL_VOICE.md' },
    };
  }

  listCorpus(organizationId: string) {
    const docs = this.docs
      .filter((d) => d.organizationId === organizationId)
      .map((d) => ({ id: d.id, agencyId: d.agencyId, title: d.title, hash: d.hash, createdAt: d.createdAt }));
    return { docs, count: docs.length };
  }

  async registerAgency(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const agencyId = String(body.agencyId ?? '').trim().toLowerCase();
    const name = String(body.name ?? '').trim();
    if (!agencyId || !name) {
      throw new ApiException('validation_error', 'agencyId and name required', HttpStatus.BAD_REQUEST);
    }
    const agency: Agency = {
      id: agencyId,
      organizationId: session.organizationId,
      name,
      voiceId: String(body.voiceId ?? 'alloy').trim() || 'alloy',
      createdAt: new Date().toISOString(),
    };
    this.agencies.set(`${session.organizationId}:${agencyId}`, agency);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'institutional-voice.agency.register',
      ip,
      metadata: { agencyId, name },
    });
    return { agency };
  }

  async ingest(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const agencyId = String(body.agencyId ?? '').trim().toLowerCase();
    const title = String(body.title ?? '').trim();
    const docBody = String(body.body ?? '').trim();
    if (!agencyId || !title || !docBody) {
      throw new ApiException('validation_error', 'agencyId, title, body required', HttpStatus.BAD_REQUEST);
    }
    if (!this.agencies.has(`${session.organizationId}:${agencyId}`)) {
      throw new ApiException('not_found', 'Register agency first', HttpStatus.NOT_FOUND);
    }
    const doc: Doc = {
      id: randomUUID(),
      organizationId: session.organizationId,
      agencyId,
      title,
      body: docBody,
      hash: createHash('sha256').update(docBody).digest('hex'),
      createdAt: new Date().toISOString(),
    };
    this.docs.push(doc);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'institutional-voice.corpus.ingest',
      ip,
      metadata: { docId: doc.id, agencyId, title },
    });
    return { doc: { id: doc.id, agencyId, title, hash: doc.hash, createdAt: doc.createdAt } };
  }

  async speak(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const agencyId = String(body.agencyId ?? '').trim().toLowerCase();
    const question = String(body.question ?? body.text ?? '').trim();
    if (!agencyId || !question) {
      throw new ApiException('validation_error', 'agencyId and question required', HttpStatus.BAD_REQUEST);
    }
    const agency = this.agencies.get(`${session.organizationId}:${agencyId}`);
    if (!agency) throw new ApiException('not_found', 'Unknown agency', HttpStatus.NOT_FOUND);
    const corpus = this.docs.filter((d) => d.organizationId === session.organizationId && d.agencyId === agencyId);
    const qTokens = question.toLowerCase().split(/\W+/).filter((t) => t.length > 3);
    let best: { doc: Doc; score: number; span: string } | null = null;
    for (const doc of corpus) {
      const lower = doc.body.toLowerCase();
      const hits = qTokens.filter((t) => lower.includes(t)).length;
      if (hits === 0) continue;
      const score = hits / Math.max(1, qTokens.length);
      const idx = lower.indexOf(qTokens.find((t) => lower.includes(t))!);
      const span = doc.body.slice(Math.max(0, idx - 40), Math.min(doc.body.length, idx + 180)).trim();
      if (!best || score > best.score) best = { doc, score, span };
    }
    if (!best || best.score < 0.34) {
      await this.audit.record({
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'institutional-voice.speak.refuse',
        ip,
        metadata: { agencyId, reason: 'no_corpus_span' },
      });
      return {
        allowed: false,
        refused: true,
        reason: 'No approved corpus span matches this question. Institutional voice will not improvise policy.',
        agencyId,
        voiceId: agency.voiceId,
      };
    }
    const answer = `${best.span}${best.span.endsWith('.') ? '' : '.'} (Source: ${best.doc.title})`;
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'institutional-voice.speak.allow',
      ip,
      metadata: { agencyId, docId: best.doc.id, score: best.score },
    });
    return {
      allowed: true,
      refused: false,
      agencyId,
      voiceId: agency.voiceId,
      answer,
      citation: { docId: best.doc.id, title: best.doc.title, hash: best.doc.hash, score: best.score },
      speakHint: { endpoint: 'POST /v1/audio/speech', voice: agency.voiceId, text: answer },
    };
  }
}
