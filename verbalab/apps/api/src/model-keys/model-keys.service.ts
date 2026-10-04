import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  generateModelApiKeySecret,
  generatePlatformModelRootKey,
  hashModelApiKey,
  looksLikeModelApiKey,
  looksLikePlatformModelRootKey,
  type ModelKeyEnvironment,
} from '../common/crypto/model-keys';

const DEFAULT_SCOPES = ['*'] as const;

@Injectable()
export class ModelKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Owner or admin role required to manage model keys',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async create(input: {
    organizationId: string;
    workspaceId?: string;
    userId?: string;
    role: string;
    name: string;
    environment?: string;
    scopes?: string[];
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    const org = await this.prisma.organization.findFirst({
      where: { id: input.organizationId },
      select: { id: true, disabledAt: true },
    });
    if (!org) {
      throw new ApiException('not_found', 'Organization not found', HttpStatus.NOT_FOUND);
    }
    if (org.disabledAt) {
      throw new ApiException('org_disabled', 'Organization is disabled', HttpStatus.FORBIDDEN);
    }

    const environment: ModelKeyEnvironment = input.environment === 'test' ? 'test' : 'live';
    const { secret, prefix, hash } = generateModelApiKeySecret(environment);
    const scopes = normalizeScopes(input.scopes);
    const key = await this.prisma.modelApiKey.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        createdById: input.userId,
        name: input.name.trim(),
        prefix,
        secretHash: hash,
        kind: environment,
        scopes,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'model_api_key.created',
      route: 'POST /v1/model-keys',
      ip: input.ip,
      metadata: { keyId: key.id, name: key.name, kind: key.kind, scopes },
    });

    return {
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      kind: key.kind,
      scopes: key.scopes,
      secret,
      note: 'Store this secret now — it is shown once. Use as Authorization: Bearer for VerbaLab model calls, or set VERBALAB_MODEL_API_KEY for platform root.',
      createdAt: key.createdAt,
    };
  }

  /**
   * Mint a platform root key for deploy (.env VERBALAB_MODEL_API_KEY).
   * Org-scoped record kept for audit; secret returned once.
   */
  async mintPlatformRoot(input: {
    organizationId: string;
    userId?: string;
    role: string;
    name?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    const { secret, prefix, hash } = generatePlatformModelRootKey();
    const key = await this.prisma.modelApiKey.create({
      data: {
        organizationId: input.organizationId,
        createdById: input.userId,
        name: input.name?.trim() || 'Platform model root',
        prefix,
        secretHash: hash,
        kind: 'root',
        scopes: [...DEFAULT_SCOPES],
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'model_api_key.root_minted',
      route: 'POST /v1/model-keys/platform-root',
      ip: input.ip,
      metadata: { keyId: key.id, prefix },
    });

    return {
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      kind: 'root',
      scopes: key.scopes,
      secret,
      envSnippet: `VERBALAB_MODEL_API_KEY=${secret}`,
      note: 'Add to apps/api/.env and your model-service deploy. Shown once.',
      createdAt: key.createdAt,
    };
  }

  async list(organizationId: string) {
    const keys = await this.prisma.modelApiKey.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map((key) => ({
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      kind: key.kind,
      scopes: key.scopes,
      revokedAt: key.revokedAt,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      workspaceId: key.workspaceId,
    }));
  }

  async revoke(organizationId: string, keyId: string, opts: { userId?: string; role: string; ip?: string }) {
    this.assertOwnerOrAdmin(opts.role);
    const key = await this.prisma.modelApiKey.findFirst({
      where: { id: keyId, organizationId },
    });
    if (!key) {
      throw new ApiException('not_found', 'Model API key not found', HttpStatus.NOT_FOUND);
    }
    if (key.revokedAt) {
      return { id: key.id, revokedAt: key.revokedAt };
    }
    const updated = await this.prisma.modelApiKey.update({
      where: { id: key.id },
      data: { revokedAt: new Date() },
    });
    await this.audit.record({
      organizationId,
      userId: opts.userId,
      action: 'model_api_key.revoked',
      route: `DELETE /v1/model-keys/${keyId}`,
      ip: opts.ip,
      metadata: { keyId: key.id, prefix: key.prefix },
    });
    return { id: updated.id, revokedAt: updated.revokedAt };
  }

  /**
   * Validate a bearer token against env root or DB model keys.
   * Used by Own AI HTTP clients' peer services and local model gateway.
   */
  async verifyBearer(token: string, modality?: string): Promise<{
    ok: true;
    kind: string;
    organizationId?: string;
    keyId?: string;
  } | { ok: false; reason: string }> {
    const secret = token.trim();
    if (!secret) return { ok: false, reason: 'missing' };

    const envRoot = process.env.VERBALAB_MODEL_API_KEY?.trim();
    if (envRoot && secret === envRoot) {
      return { ok: true, kind: 'env_root' };
    }

    if (!looksLikeModelApiKey(secret) && !looksLikePlatformModelRootKey(secret)) {
      return { ok: false, reason: 'not_a_model_key' };
    }

    const hash = hashModelApiKey(secret);
    const row = await this.prisma.modelApiKey.findFirst({
      where: { secretHash: hash, revokedAt: null },
    });
    if (!row) return { ok: false, reason: 'unknown_or_revoked' };

    if (modality && !scopeAllows(row.scopes, modality)) {
      return { ok: false, reason: 'scope_denied' };
    }

    await this.prisma.modelApiKey.update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      ok: true,
      kind: row.kind,
      organizationId: row.organizationId,
      keyId: row.id,
    };
  }

  guide() {
    return {
      productKeys: {
        prefix: ['vmod_live_', 'vmod_test_'],
        create: 'POST /v1/model-keys',
        console: '/model-keys',
        usage: 'Authorization: Bearer vmod_live_… when calling VerbaLab model endpoints',
      },
      platformRoot: {
        prefix: 'vmod_root_',
        create: 'POST /v1/model-keys/platform-root',
        env: 'VERBALAB_MODEL_API_KEY',
        usage: 'Set on API + model services for service-to-service auth',
      },
      notVendorKeys: {
        note: 'These are VerbaLab-owned keys. Do not use OpenAI/ElevenLabs/Google keys as the product default.',
      },
    };
  }
}

function normalizeScopes(scopes?: string[]): string[] {
  if (!scopes?.length) return [...DEFAULT_SCOPES];
  const cleaned = scopes.map((s) => s.trim().toLowerCase()).filter(Boolean);
  return cleaned.length ? cleaned : [...DEFAULT_SCOPES];
}

function scopeAllows(scopes: string[], modality: string): boolean {
  if (scopes.includes('*')) return true;
  return scopes.includes(modality.toLowerCase());
}
