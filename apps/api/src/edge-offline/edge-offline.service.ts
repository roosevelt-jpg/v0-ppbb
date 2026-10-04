import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { edgeOfflineCatalog, edgeOfflineHonesty } from './edge-offline.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';

const MODEL_BUNDLES = [
  { id: 'echo', name: 'Echo STT', sizeMb: 180, modality: 'stt' },
  { id: 'voice-fm', name: 'Voice FM TTS', sizeMb: 220, modality: 'tts' },
  { id: 'atlas-lite', name: 'Atlas Lite', sizeMb: 420, modality: 'llm' },
];

type OfflinePack = {
  id: string;
  organizationId: string;
  models: string[];
  locales: string[];
  deviceClass: string;
  checksum: string;
  signature?: string;
  signer?: string;
  status: 'built' | 'signed' | 'synced';
  version: number;
  builtAt: string;
  lastSyncAt?: string;
};

@Injectable()
export class EdgeOfflineService {
  private readonly packs = new Map<string, OfflinePack>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return {
      ...edgeOfflineCatalog(),
      safety: edgeOfflineHonesty(),
      models: MODEL_BUNDLES,
      packs: this.packs.size,
    };
  }

  catalog() {
    return {
      models: MODEL_BUNDLES,
      deviceClasses: ['mobile', 'kiosk', 'radio-gateway', 'laptop'],
      syncModes: ['full', 'delta', 'locales-only'],
    };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: { organizationId, createdAt: { gte: since }, action: { contains: 'edge-offline' } },
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
      catalog: this.catalog(),
      activity: await this.activity(session.organizationId),
      links: { self: '/edge-offline', docs: '/docs/EDGE_OFFLINE.md', edge: '/edge' },
    };
  }

  monitoring() {
    return { status: 'ready', honesty: edgeOfflineHonesty() };
  }

  async build(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const models = String(body.models ?? 'echo,voice-fm')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const locales = String(body.locales ?? 'sw,yo,ha')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const m of models) {
      if (!MODEL_BUNDLES.some((b) => b.id === m)) {
        throw new ApiException('validation_error', `unknown model: ${m}`, HttpStatus.BAD_REQUEST);
      }
    }
    const material = `${session.organizationId}:${models.join(',')}:${locales.join(',')}:${Date.now()}`;
    const pack: OfflinePack = {
      id: randomUUID(),
      organizationId: session.organizationId,
      models,
      locales,
      deviceClass: String(body.deviceClass ?? 'mobile'),
      checksum: createHash('sha256').update(material).digest('hex'),
      status: 'built',
      version: 1,
      builtAt: new Date().toISOString(),
    };
    this.packs.set(pack.id, pack);
    const sizeMb = models.reduce(
      (sum, id) => sum + (MODEL_BUNDLES.find((b) => b.id === id)?.sizeMb ?? 0),
      0,
    );
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'edge-offline.build',
      route: 'POST /v1/edge-offline/build',
      ip,
      metadata: { packId: pack.id, models, locales, sizeMb } as never,
    });
    return { pack, sizeMb, downloadHint: `/v1/edge-offline/packs/${pack.id}` };
  }

  async sign(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const packId = String(body.packId ?? '').trim();
    const pack = this.packs.get(packId);
    if (!pack || pack.organizationId !== session.organizationId) {
      throw new ApiException('not_found', 'pack not found', HttpStatus.NOT_FOUND);
    }
    const signer = String(body.signer ?? 'verbalab-edge');
    pack.signer = signer;
    pack.signature = createHash('sha256').update(`${pack.checksum}:${signer}`).digest('hex');
    pack.status = 'signed';
    this.packs.set(packId, pack);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'edge-offline.sign',
      route: 'POST /v1/edge-offline/sign',
      ip,
      metadata: { packId, signer } as never,
    });
    return { pack };
  }

  async sync(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const packId = String(body.packId ?? '').trim();
    const pack = this.packs.get(packId);
    if (!pack || pack.organizationId !== session.organizationId) {
      throw new ApiException('not_found', 'pack not found', HttpStatus.NOT_FOUND);
    }
    if (!pack.signature) {
      throw new ApiException('conflict', 'pack must be signed before sync', HttpStatus.CONFLICT);
    }
    pack.version += 1;
    pack.status = 'synced';
    pack.lastSyncAt = new Date().toISOString();
    this.packs.set(packId, pack);
    const deviceId = String(body.deviceId ?? 'device-unknown');
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'edge-offline.sync',
      route: 'POST /v1/edge-offline/sync',
      ip,
      metadata: { packId, deviceId, version: pack.version } as never,
    });
    return {
      pack,
      deviceId,
      delta: {
        localesAdded: [],
        modelsUpdated: pack.models,
        bytes: pack.models.length * 12_000_000,
      },
    };
  }

  async verify(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const packId = String(body.packId ?? '').trim();
    const pack = this.packs.get(packId);
    if (!pack) {
      throw new ApiException('not_found', 'pack not found', HttpStatus.NOT_FOUND);
    }
    const checksum = String(body.checksum ?? pack.checksum);
    const checksumOk = checksum === pack.checksum;
    const signatureOk = Boolean(pack.signature);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'edge-offline.verify',
      route: 'POST /v1/edge-offline/verify',
      ip,
      metadata: { packId, checksumOk, signatureOk } as never,
    });
    return {
      valid: checksumOk && signatureOk,
      checksumOk,
      signatureOk,
      pack: { id: pack.id, version: pack.version, status: pack.status },
    };
  }
}
