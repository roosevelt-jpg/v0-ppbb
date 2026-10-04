import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  voiceTrustGraphCatalog,
  voiceTrustGraphHonesty,
} from './voice-trust-graph.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';

type TrustNode = {
  id: string;
  organizationId: string;
  kind: 'person' | 'community' | 'org';
  name: string;
  country?: string;
  createdAt: string;
};

type ConsentEdge = {
  id: string;
  organizationId: string;
  fromNodeId: string;
  toNodeId: string;
  purposes: string[];
  countries: string[];
  expiresAt?: string;
  status: 'active' | 'revoked';
  witnesses: string[];
  createdAt: string;
};

@Injectable()
export class VoiceTrustGraphService {
  private readonly nodeStore = new Map<string, TrustNode>();
  private readonly edgeStore = new Map<string, ConsentEdge>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return {
      ...voiceTrustGraphCatalog(),
      safety: voiceTrustGraphHonesty(),
      nodes: this.nodeStore.size,
      edges: this.edgeStore.size,
    };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: { organizationId, createdAt: { gte: since }, action: { contains: 'voice-trust' } },
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
    const orgNodes = [...this.nodeStore.values()].filter((n) => n.organizationId === session.organizationId);
    const orgEdges = [...this.edgeStore.values()].filter((e) => e.organizationId === session.organizationId);
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine: this.engine(),
      graph: { nodes: orgNodes, edges: orgEdges },
      activity: await this.activity(session.organizationId),
      links: { self: '/voice-trust-graph', docs: '/docs/VOICE_TRUST_GRAPH.md' },
    };
  }

  monitoring() {
    return { status: 'ready', honesty: voiceTrustGraphHonesty() };
  }

  async nodes(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const node: TrustNode = {
      id: randomUUID(),
      organizationId: session.organizationId,
      kind: (String(body.kind ?? 'person') as TrustNode['kind']) || 'person',
      name: String(body.name ?? 'Unnamed').trim() || 'Unnamed',
      country: body.country ? String(body.country) : undefined,
      createdAt: new Date().toISOString(),
    };
    this.nodeStore.set(node.id, node);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'voice-trust-graph.nodes',
      route: 'POST /v1/voice-trust-graph/nodes',
      ip,
      metadata: { nodeId: node.id, kind: node.kind } as never,
    });
    return { node };
  }

  async consent(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const fromNodeId = String(body.fromNodeId ?? '');
    const toNodeId = String(body.toNodeId ?? '');
    if (!this.nodeStore.get(fromNodeId) || !this.nodeStore.get(toNodeId)) {
      throw new ApiException('validation_error', 'fromNodeId and toNodeId must exist', HttpStatus.BAD_REQUEST);
    }
    const edge: ConsentEdge = {
      id: randomUUID(),
      organizationId: session.organizationId,
      fromNodeId,
      toNodeId,
      purposes: Array.isArray(body.purposes)
        ? body.purposes.map(String)
        : [String(body.purpose ?? 'voice_clone')],
      countries: Array.isArray(body.countries)
        ? body.countries.map(String)
        : body.country
          ? [String(body.country)]
          : ['*'],
      expiresAt: body.expiresAt ? String(body.expiresAt) : undefined,
      status: 'active',
      witnesses: [],
      createdAt: new Date().toISOString(),
    };
    this.edgeStore.set(edge.id, edge);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'voice-trust-graph.consent',
      route: 'POST /v1/voice-trust-graph/consent',
      ip,
      metadata: { edgeId: edge.id, purposes: edge.purposes } as never,
    });
    return { edge };
  }

  async witness(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const edgeId = String(body.edgeId ?? '');
    const edge = this.edgeStore.get(edgeId);
    if (!edge || edge.organizationId !== session.organizationId) {
      throw new ApiException('not_found', 'consent edge not found', HttpStatus.NOT_FOUND);
    }
    const name = String(body.witnessName ?? body.name ?? 'Community witness').trim();
    edge.witnesses.push(name);
    this.edgeStore.set(edgeId, edge);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'voice-trust-graph.witness',
      route: 'POST /v1/voice-trust-graph/witness',
      ip,
      metadata: { edgeId, witness: name } as never,
    });
    return { edge };
  }

  async revoke(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const edgeId = String(body.edgeId ?? '');
    const edge = this.edgeStore.get(edgeId);
    if (!edge || edge.organizationId !== session.organizationId) {
      throw new ApiException('not_found', 'consent edge not found', HttpStatus.NOT_FOUND);
    }
    edge.status = 'revoked';
    this.edgeStore.set(edgeId, edge);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'voice-trust-graph.revoke',
      route: 'POST /v1/voice-trust-graph/revoke',
      ip,
      metadata: { edgeId, reason: String(body.reason ?? 'revoked') } as never,
    });
    return {
      edge,
      lineage: {
        watermarkHint: `vtg:${edgeId}:revoked`,
        cannotSellAds: true,
        note: 'Downstream clones inheriting this edge must stop synthesis.',
      },
    };
  }

  async check(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const fromNodeId = String(body.fromNodeId ?? '');
    const toNodeId = String(body.toNodeId ?? '');
    const purpose = String(body.purpose ?? 'voice_clone');
    const country = String(body.country ?? '*');
    const now = Date.now();
    const matches = [...this.edgeStore.values()].filter((e) => {
      if (e.organizationId !== session.organizationId) return false;
      if (e.fromNodeId !== fromNodeId || e.toNodeId !== toNodeId) return false;
      if (e.status !== 'active') return false;
      if (e.expiresAt && Date.parse(e.expiresAt) < now) return false;
      if (!e.purposes.includes(purpose) && !e.purposes.includes('*')) return false;
      if (!e.countries.includes(country) && !e.countries.includes('*')) return false;
      return true;
    });
    const allowed = matches.length > 0 && matches.every((m) => m.witnesses.length > 0 || body.allowWithoutWitness === true);
    const result = {
      allowed,
      purpose,
      country,
      matchingEdges: matches.map((m) => m.id),
      requiresWitness: matches.some((m) => m.witnesses.length === 0),
      reason: allowed
        ? 'Consent graph authorizes this clone use.'
        : 'No active witnessed consent edge covers this purpose/country.',
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'voice-trust-graph.check',
      route: 'POST /v1/voice-trust-graph/check',
      ip,
      metadata: { allowed, purpose, country } as never,
    });
    return result;
  }
}
