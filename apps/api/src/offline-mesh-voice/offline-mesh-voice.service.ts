
import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  offlineMeshVoiceCatalog,
  offlineMeshVoiceHonesty,
} from './offline-mesh-voice.catalog';

type Node = {
  id: string;
  organizationId: string;
  site: string;
  country: string;
  capabilities: string[];
  lastSyncAt?: string;
  createdAt: string;
};

type Job = {
  id: string;
  organizationId: string;
  nodeId: string;
  kind: string;
  payload: string;
  status: 'queued' | 'synced';
  createdAt: string;
  syncedAt?: string;
};

type Receipt = {
  id: string;
  organizationId: string;
  nodeId: string;
  syncedJobIds: string[];
  createdAt: string;
};

@Injectable()
export class OfflineMeshVoiceService {
  private readonly nodes = new Map<string, Node>();
  private readonly jobs: Job[] = [];
  private readonly receipts: Receipt[] = [];

  constructor(private readonly audit: AuditService) {}

  engine() {
    return {
      ...offlineMeshVoiceCatalog(),
      safety: offlineMeshVoiceHonesty(),
      nodes: this.nodes.size,
      queued: this.jobs.filter((j) => j.status === 'queued').length,
    };
  }

  monitoring() {
    return { status: 'ready', honesty: offlineMeshVoiceHonesty() };
  }

  async overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        role: session.role,
      },
      engine: this.engine(),
      nodes: this.listNodes(session.organizationId),
      links: { self: '/offline-mesh-voice', docs: '/docs/OFFLINE_MESH_VOICE.md', edgePacks: '/edge-offline' },
    };
  }

  listNodes(organizationId: string) {
    const nodes = [...this.nodes.values()].filter((n) => n.organizationId === organizationId);
    return { nodes, count: nodes.length };
  }

  getReceipt(organizationId: string, id: string) {
    const row = this.receipts.find((r) => r.id === id && r.organizationId === organizationId);
    if (!row) throw new ApiException('not_found', 'Receipt not found', HttpStatus.NOT_FOUND);
    return row;
  }

  async registerNode(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const nodeId = String(body.nodeId ?? '').trim().toLowerCase();
    if (!nodeId) throw new ApiException('validation_error', 'nodeId required', HttpStatus.BAD_REQUEST);
    const caps = String(body.capabilities ?? 'stt,tts')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const node: Node = {
      id: nodeId,
      organizationId: session.organizationId,
      site: String(body.site ?? nodeId).trim(),
      country: String(body.country ?? 'AF').trim().toUpperCase(),
      capabilities: caps.length ? caps : ['stt', 'tts'],
      createdAt: new Date().toISOString(),
    };
    this.nodes.set(`${session.organizationId}:${nodeId}`, node);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'offline-mesh-voice.node.register',
      ip,
      metadata: { nodeId, site: node.site, country: node.country },
    });
    return { node };
  }

  async enqueue(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const nodeId = String(body.nodeId ?? '').trim().toLowerCase();
    if (!this.nodes.has(`${session.organizationId}:${nodeId}`)) {
      throw new ApiException('not_found', 'Register node first', HttpStatus.NOT_FOUND);
    }
    const job: Job = {
      id: randomUUID(),
      organizationId: session.organizationId,
      nodeId,
      kind: String(body.kind ?? 'stt').trim() || 'stt',
      payload: String(body.payload ?? '').trim() || 'opaque',
      status: 'queued',
      createdAt: new Date().toISOString(),
    };
    this.jobs.push(job);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'offline-mesh-voice.queue.enqueue',
      ip,
      metadata: { jobId: job.id, nodeId, kind: job.kind },
    });
    return { job };
  }

  async sync(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const nodeId = String(body.nodeId ?? '').trim().toLowerCase();
    const node = this.nodes.get(`${session.organizationId}:${nodeId}`);
    if (!node) throw new ApiException('not_found', 'Unknown node', HttpStatus.NOT_FOUND);
    const pending = this.jobs.filter(
      (j) => j.organizationId === session.organizationId && j.nodeId === nodeId && j.status === 'queued',
    );
    const now = new Date().toISOString();
    for (const job of pending) {
      job.status = 'synced';
      job.syncedAt = now;
    }
    node.lastSyncAt = now;
    const receipt: Receipt = {
      id: randomUUID(),
      organizationId: session.organizationId,
      nodeId,
      syncedJobIds: pending.map((j) => j.id),
      createdAt: now,
    };
    this.receipts.push(receipt);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'offline-mesh-voice.sync',
      ip,
      metadata: { nodeId, receiptId: receipt.id, synced: pending.length },
    });
    return {
      receipt,
      synced: pending.length,
      note: 'Store-and-forward drain complete. Pair with Edge Offline packs for on-device STT/TTS binaries.',
    };
  }
}
