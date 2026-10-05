import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TranslateService } from '../translate/translate.service';
import { ApiException } from '../common/errors/api-exception';
import {
  interpreterMeshCatalog,
  interpreterMeshHonesty,
} from './interpreter-mesh.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';

type MeshSession = {
  id: string;
  organizationId: string;
  workspaceId: string;
  title: string;
  listeners: Array<{ id: string; label: string; dialect: string; register: string }>;
  backbone: Array<{ id: string; intent: string; entities: string[]; at: string }>;
  channels: Record<string, Array<{ text: string; at: string }>>;
  createdAt: string;
};

@Injectable()
export class InterpreterMeshService {
  private readonly sessionStore = new Map<string, MeshSession>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly translate: TranslateService,
  ) {}

  engine() {
    return {
      ...interpreterMeshCatalog(),
      safety: interpreterMeshHonesty(),
      activeSessions: this.sessionStore.size,
    };
  }

  backbone() {
    return {
      model: 'shared-semantic-backbone-v1',
      fields: ['intent', 'entities', 'speechAct', 'register', 'urgency'],
      note: 'Listeners render from backbone — not from each other’s surface forms.',
    };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: { organizationId, createdAt: { gte: since }, action: { contains: 'interpreter-mesh' } },
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
    const rows = [...this.sessionStore.values()].filter((s) => s.organizationId === session.organizationId);
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine: this.engine(),
      sessions: rows,
      backbone: this.backbone(),
      activity: await this.activity(session.organizationId),
      links: { self: '/interpreter-mesh', docs: '/docs/INTERPRETER_MESH.md' },
    };
  }

  monitoring() {
    return { status: 'ready', honesty: interpreterMeshHonesty() };
  }

  async sessions(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const mesh: MeshSession = {
      id: randomUUID(),
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      title: String(body.title ?? 'Market / clinic mesh').trim(),
      listeners: [],
      backbone: [],
      channels: {},
      createdAt: new Date().toISOString(),
    };
    this.sessionStore.set(mesh.id, mesh);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'interpreter-mesh.sessions',
      route: 'POST /v1/interpreter-mesh/sessions',
      ip,
      metadata: { sessionId: mesh.id } as never,
    });
    return { session: mesh };
  }

  async listen(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const sessionId = String(body.sessionId ?? '');
    const mesh = this.sessionStore.get(sessionId);
    if (!mesh || mesh.organizationId !== session.organizationId) {
      throw new ApiException('not_found', 'mesh session not found', HttpStatus.NOT_FOUND);
    }
    const listener = {
      id: randomUUID(),
      label: String(body.label ?? 'Listener').trim(),
      dialect: String(body.dialect ?? body.lang ?? 'en').trim(),
      register: String(body.register ?? 'neutral').trim(),
    };
    mesh.listeners.push(listener);
    mesh.channels[listener.id] = [];
    this.sessionStore.set(sessionId, mesh);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'interpreter-mesh.listen',
      route: 'POST /v1/interpreter-mesh/listen',
      ip,
      metadata: { sessionId, listenerId: listener.id, dialect: listener.dialect } as never,
    });
    return { sessionId, listener };
  }

  async broadcast(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const sessionId = String(body.sessionId ?? '');
    const mesh = this.sessionStore.get(sessionId);
    if (!mesh || mesh.organizationId !== session.organizationId) {
      throw new ApiException('not_found', 'mesh session not found', HttpStatus.NOT_FOUND);
    }
    const text = String(body.text ?? '').trim();
    if (!text) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    const intent = String(body.intent ?? guessIntent(text));
    const entities = Array.isArray(body.entities)
      ? body.entities.map(String)
      : text.split(/\s+/).filter((w) => w.length > 5).slice(0, 4);
    const spine = {
      id: randomUUID(),
      intent,
      entities,
      at: new Date().toISOString(),
    };
    mesh.backbone.push(spine);

    const deliveries: Array<{ listenerId: string; dialect: string; text: string }> = [];
    for (const listener of mesh.listeners) {
      const translated = await this.translate.translate({
        text,
        source: typeof body.source === 'string' ? body.source : 'auto',
        target: listener.dialect.split('-')[0] || 'en',
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        skipReview: true,
      });
      const rendered =
        listener.register === 'formal'
          ? `[formal] ${translated.text}`
          : listener.register === 'market'
            ? `[market] ${translated.text}`
            : translated.text;
      mesh.channels[listener.id] = [
        ...(mesh.channels[listener.id] ?? []),
        { text: rendered, at: spine.at },
      ];
      deliveries.push({ listenerId: listener.id, dialect: listener.dialect, text: rendered });
    }
    this.sessionStore.set(sessionId, mesh);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'interpreter-mesh.broadcast',
      route: 'POST /v1/interpreter-mesh/broadcast',
      ip,
      metadata: { sessionId, listeners: deliveries.length, intent } as never,
    });
    return { sessionId, backbone: spine, deliveries };
  }
}

function guessIntent(text: string) {
  const lower = text.toLowerCase();
  if (/(price|bei|prix|thalath|naira)/.test(lower)) return 'commerce.price';
  if (/(pain|clinic|dawa|hospital|santé)/.test(lower)) return 'health.symptom';
  if (/(vote|ballot|election|siasa)/.test(lower)) return 'civic.speech';
  return 'general.utterance';
}
