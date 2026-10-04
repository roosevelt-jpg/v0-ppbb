
import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  civicVoiceEvidenceCatalog,
  civicVoiceEvidenceHonesty,
} from './civic-voice-evidence.catalog';

type Evidence = {
  id: string;
  organizationId: string;
  seq: number;
  utteranceHash: string;
  utterancePreview: string;
  actor: string;
  consentId?: string;
  watermarkTip?: string;
  prevHash: string;
  chainHash: string;
  createdAt: string;
};

@Injectable()
export class CivicVoiceEvidenceService {
  private readonly byOrg = new Map<string, Evidence[]>();

  constructor(private readonly audit: AuditService) {}

  engine() {
    return {
      ...civicVoiceEvidenceCatalog(),
      safety: civicVoiceEvidenceHonesty(),
      orgsWithChains: this.byOrg.size,
    };
  }

  monitoring() {
    return { status: 'ready', honesty: civicVoiceEvidenceHonesty() };
  }

  private chain(organizationId: string) {
    if (!this.byOrg.has(organizationId)) this.byOrg.set(organizationId, []);
    return this.byOrg.get(organizationId)!;
  }

  async overview(session: SessionContext) {
    const chain = this.chain(session.organizationId);
    return {
      session: {
        organizationId: session.organizationId,
        role: session.role,
      },
      engine: this.engine(),
      tip: chain.length ? chain[chain.length - 1] : null,
      length: chain.length,
      links: { self: '/civic-voice-evidence', docs: '/docs/CIVIC_VOICE_EVIDENCE.md' },
    };
  }

  listChain(organizationId: string) {
    const chain = this.chain(organizationId);
    return {
      length: chain.length,
      tip: chain.length ? chain[chain.length - 1] : null,
      records: chain.slice(-50),
    };
  }

  get(organizationId: string, id: string) {
    const row = this.chain(organizationId).find((e) => e.id === id);
    if (!row) throw new ApiException('not_found', 'Evidence not found', HttpStatus.NOT_FOUND);
    return row;
  }

  async append(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const utterance = String(body.utterance ?? body.text ?? '').trim();
    if (!utterance) {
      throw new ApiException('validation_error', 'utterance is required', HttpStatus.BAD_REQUEST);
    }
    const chain = this.chain(session.organizationId);
    const prevHash = chain.length ? chain[chain.length - 1].chainHash : 'GENESIS';
    const utteranceHash = createHash('sha256').update(utterance).digest('hex');
    const seq = chain.length + 1;
    const material = `${prevHash}|${seq}|${utteranceHash}|${body.actor ?? ''}|${body.consentId ?? ''}|${body.watermarkTip ?? ''}`;
    const record: Evidence = {
      id: randomUUID(),
      organizationId: session.organizationId,
      seq,
      utteranceHash,
      utterancePreview: utterance.slice(0, 160),
      actor: String(body.actor ?? 'unknown').trim() || 'unknown',
      consentId: body.consentId ? String(body.consentId) : undefined,
      watermarkTip: body.watermarkTip ? String(body.watermarkTip) : undefined,
      prevHash,
      chainHash: createHash('sha256').update(material).digest('hex'),
      createdAt: new Date().toISOString(),
    };
    chain.push(record);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'civic-voice-evidence.append',
      ip,
      metadata: { id: record.id, seq, chainHash: record.chainHash },
    });
    return { record, length: chain.length };
  }

  verify(organizationId: string) {
    const chain = this.chain(organizationId);
    let prev = 'GENESIS';
    for (const row of chain) {
      if (row.prevHash !== prev) {
        return { ok: false, brokenAt: row.seq, reason: 'prevHash mismatch' };
      }
      const material = `${row.prevHash}|${row.seq}|${row.utteranceHash}|${row.actor}|${row.consentId ?? ''}|${row.watermarkTip ?? ''}`;
      const expect = createHash('sha256').update(material).digest('hex');
      if (expect !== row.chainHash) {
        return { ok: false, brokenAt: row.seq, reason: 'chainHash mismatch' };
      }
      prev = row.chainHash;
    }
    return { ok: true, length: chain.length, tip: chain.length ? chain[chain.length - 1].chainHash : 'GENESIS' };
  }

  async exportPackage(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const chain = this.chain(session.organizationId);
    const fromSeq = Math.max(1, Number(body.fromSeq ?? 1) || 1);
    const toSeq = Math.min(chain.length, Number(body.toSeq ?? chain.length) || chain.length);
    const slice = chain.filter((e) => e.seq >= fromSeq && e.seq <= toSeq);
    const pkg = {
      exportId: randomUUID(),
      exportedAt: new Date().toISOString(),
      organizationId: session.organizationId,
      fromSeq,
      toSeq,
      records: slice,
      integrity: this.verify(session.organizationId),
      note: 'Court-facing evidence package. Verify chainHash links before admitting.',
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'civic-voice-evidence.export',
      ip,
      metadata: { exportId: pkg.exportId, fromSeq, toSeq, count: slice.length },
    });
    return pkg;
  }
}
