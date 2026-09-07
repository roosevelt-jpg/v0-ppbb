import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { LocalStorageService } from '../documents/local-storage.service';
import {
  ElevenLabsVoiceCloneAdapter,
  FixtureVoiceCloneAdapter,
  type VoiceCloneSample,
} from './elevenlabs-voice-clone.adapter';

export const VOICE_CLONE_PREFIX = 'clone:';

export function voiceCloneIdFromVoice(voice: string): string | null {
  if (!voice.startsWith(VOICE_CLONE_PREFIX)) return null;
  return voice.slice(VOICE_CLONE_PREFIX.length) || null;
}

@Injectable()
export class VoiceClonesService {
  private fixtureOverride: FixtureVoiceCloneAdapter | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly audit: AuditService,
    private readonly storage: LocalStorageService,
  ) {}

  setFixtureForTests(adapter: FixtureVoiceCloneAdapter | null) {
    this.fixtureOverride = adapter;
  }

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Owner or admin role required for voice cloning',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private provider() {
    if (this.fixtureOverride) return this.fixtureOverride;
    if (process.env.VOICE_CLONE_FIXTURE === '1') return new FixtureVoiceCloneAdapter();
    return new ElevenLabsVoiceCloneAdapter(process.env.ELEVENLABS_API_KEY ?? '');
  }

  serialize(row: {
    id: string;
    name: string;
    status: string;
    consentAttested: boolean;
    consentNotes: string;
    consentAttestedAt: Date;
    watermarkRequired: boolean;
    sampleCount: number;
    provider: string;
    providerVoiceId: string | null;
    reviewNotes: string | null;
    reviewedAt: Date | null;
    disabledReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      voice: `${VOICE_CLONE_PREFIX}${row.id}`,
      name: row.name,
      status: row.status,
      consentAttested: row.consentAttested,
      consentNotes: row.consentNotes,
      consentAttestedAt: row.consentAttestedAt,
      watermarkRequired: row.watermarkRequired,
      sampleCount: row.sampleCount,
      provider: row.provider,
      providerVoiceId: row.providerVoiceId,
      reviewNotes: row.reviewNotes,
      reviewedAt: row.reviewedAt,
      disabledReason: row.disabledReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      usable: row.status === 'approved' && Boolean(row.providerVoiceId),
    };
  }

  list(organizationId: string, workspaceId: string) {
    return this.prisma.voiceClone
      .findMany({
        where: { organizationId, workspaceId },
        orderBy: { createdAt: 'desc' },
      })
      .then((rows) => rows.map((r) => this.serialize(r)));
  }

  async get(organizationId: string, workspaceId: string, id: string) {
    const row = await this.prisma.voiceClone.findFirst({
      where: { id, organizationId, workspaceId },
    });
    if (!row) {
      throw new ApiException('not_found', 'Voice clone not found', HttpStatus.NOT_FOUND);
    }
    return this.serialize(row);
  }

  async create(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    name: string;
    consentAttested: boolean;
    consentNotes: string;
    files: Express.Multer.File[];
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    if (!input.consentAttested) {
      throw new ApiException(
        'validation_error',
        'consentAttested must be true — you must attest speaker rights and informed consent',
        HttpStatus.BAD_REQUEST,
      );
    }
    const notes = input.consentNotes?.trim() ?? '';
    if (notes.length < 8) {
      throw new ApiException(
        'validation_error',
        'consentNotes must describe the consent basis (min 8 chars)',
        HttpStatus.BAD_REQUEST,
      );
    }
    const name = input.name?.trim() ?? '';
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    if (!input.files?.length) {
      throw new ApiException(
        'validation_error',
        'At least one sample audio file is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const keys: string[] = [];
    for (const file of input.files) {
      const key = `voices/${input.organizationId}/${randomUUID()}-${file.originalname}`;
      await this.storage.writeBuffer(key, file.buffer);
      keys.push(key);
    }

    const row = await this.prisma.voiceClone.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        name,
        status: 'pending_review',
        consentAttested: true,
        consentNotes: notes,
        consentAttestedAt: new Date(),
        consentAttestedBy: input.userId,
        watermarkRequired: true,
        sampleStorageKeys: keys as Prisma.InputJsonValue,
        sampleCount: keys.length,
        provider: 'elevenlabs',
        createdByUserId: input.userId,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice_clone.created',
      route: 'POST /v1/voice-clones',
      ip: input.ip,
      metadata: { voiceCloneId: row.id, sampleCount: keys.length, status: row.status },
    });

    return this.serialize(row);
  }

  async review(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    id: string;
    decision: 'approved' | 'rejected';
    reviewNotes?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    const row = await this.prisma.voiceClone.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!row) {
      throw new ApiException('not_found', 'Voice clone not found', HttpStatus.NOT_FOUND);
    }
    if (row.status !== 'pending_review') {
      throw new ApiException(
        'conflict',
        `Voice clone is ${row.status}; only pending_review can be reviewed`,
        HttpStatus.CONFLICT,
      );
    }

    if (input.decision === 'rejected') {
      const updated = await this.prisma.voiceClone.update({
        where: { id: row.id },
        data: {
          status: 'rejected',
          reviewNotes: input.reviewNotes?.trim() || 'Rejected in abuse review',
          reviewedBy: input.userId,
          reviewedAt: new Date(),
        },
      });
      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'voice_clone.rejected',
        route: `POST /v1/voice-clones/${row.id}/review`,
        ip: input.ip,
        metadata: { voiceCloneId: row.id },
      });
      return this.serialize(updated);
    }

    const keys = row.sampleStorageKeys as string[];
    const samples: VoiceCloneSample[] = [];
    for (const key of keys) {
      const buffer = await this.storage.readBuffer(key);
      const filename = key.split('/').pop() ?? 'sample.wav';
      samples.push({
        filename,
        mimeType: filename.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav',
        buffer,
      });
    }

    const created = await this.provider().createClone({
      name: row.name,
      description: `VerbaLab clone ${row.id}. Consent: ${row.consentNotes}`,
      samples,
    });

    const updated = await this.prisma.voiceClone.update({
      where: { id: row.id },
      data: {
        status: 'approved',
        provider: created.provider,
        providerVoiceId: created.providerVoiceId,
        reviewNotes: input.reviewNotes?.trim() || 'Approved after consent abuse review',
        reviewedBy: input.userId,
        reviewedAt: new Date(),
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice_clone.approved',
      route: `POST /v1/voice-clones/${row.id}/review`,
      ip: input.ip,
      metadata: {
        voiceCloneId: row.id,
        providerVoiceId: created.providerVoiceId,
        provider: created.provider,
      },
    });

    return this.serialize(updated);
  }

  async disable(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    id: string;
    reason?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    const row = await this.prisma.voiceClone.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!row) {
      throw new ApiException('not_found', 'Voice clone not found', HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.voiceClone.update({
      where: { id: row.id },
      data: {
        status: 'disabled',
        disabledReason: input.reason?.trim() || 'Disabled for abuse / policy',
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice_clone.disabled',
      route: `POST /v1/voice-clones/${row.id}/disable`,
      ip: input.ip,
      metadata: { voiceCloneId: row.id, reason: updated.disabledReason },
    });

    return this.serialize(updated);
  }

  /** Resolve an approved clone for TTS; enforces watermark requirement. */
  async resolveForSpeech(input: {
    organizationId: string;
    workspaceId: string;
    voice: string;
  }) {
    const id = voiceCloneIdFromVoice(input.voice);
    if (!id) return null;

    const row = await this.prisma.voiceClone.findFirst({
      where: {
        id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!row) {
      throw new ApiException('not_found', 'Voice clone not found', HttpStatus.NOT_FOUND);
    }
    if (row.status !== 'approved' || !row.providerVoiceId) {
      throw new ApiException(
        'forbidden',
        `Voice clone is not usable (status=${row.status})`,
        HttpStatus.FORBIDDEN,
      );
    }
    if (!row.watermarkRequired) {
      throw new ApiException(
        'forbidden',
        'Cloned voices require watermarking; this profile is misconfigured',
        HttpStatus.FORBIDDEN,
      );
    }

    return {
      profile: this.serialize(row),
      providerVoiceId: row.providerVoiceId,
      watermarkRequired: true as const,
    };
  }

  async synthesizeClone(input: {
    text: string;
    voice: string;
    providerVoiceId: string;
    format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
  }) {
    return this.provider().synthesize({
      text: input.text,
      voice: input.voice,
      providerVoiceId: input.providerVoiceId,
      format: input.format ?? 'mp3',
    });
  }
}
