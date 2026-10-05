import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit, forwardRef } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Job as BullJob, Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { TranslateService } from '../translate/translate.service';
import { WebhookService } from './webhook.service';
import {
  BatchTranslateInput,
  BatchTranslateResult,
  CloneJobInput,
  CloneJobResult,
  DocumentTranslateResult,
  DubJobInput,
  DubJobResult,
  JOB_QUEUE_NAME,
  JobType,
} from './job.types';
import { AuditService } from '../audit/audit.service';
import { DocumentsService } from '../documents/documents.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { WorkflowResult } from '../workflows/workflow.types';
import { VideoVoiceService } from '../video-voice/video-voice.service';
import { VoiceClonesService } from '../voice-clones/voice-clones.service';

type QueueJobPayload = { jobId: string };

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private queue: Queue<QueueJobPayload> | null = null;
  private worker: Worker<QueueJobPayload> | null = null;
  private queueConnection: IORedis | null = null;
  private workerConnection: IORedis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly translate: TranslateService,
    private readonly webhooks: WebhookService,
    private readonly audit: AuditService,
    @Inject(forwardRef(() => DocumentsService))
    private readonly documents: DocumentsService,
    private readonly notifications: NotificationsService,
    @Inject(forwardRef(() => WorkflowsService))
    private readonly workflows: WorkflowsService,
    private readonly videoVoice: VideoVoiceService,
    private readonly voiceClones: VoiceClonesService,
  ) {}

  private redisEnabled() {
    return process.env.JOBS_INLINE !== '1';
  }

  private createRedis() {
    const url = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
    return new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }

  async onModuleInit() {
    if (!this.redisEnabled()) {
      this.logger.warn('JOBS_INLINE=1 — processing jobs in-process without Redis/BullMQ');
      return;
    }

    try {
      this.queueConnection = this.createRedis();
      this.workerConnection = this.createRedis();
      await this.queueConnection.connect();
      await this.workerConnection.connect();

      this.queue = new Queue(JOB_QUEUE_NAME, { connection: this.queueConnection });
      this.worker = new Worker(
        JOB_QUEUE_NAME,
        async (bullJob: BullJob<QueueJobPayload>) => {
          await this.processJob(bullJob.data.jobId);
        },
        { connection: this.workerConnection, concurrency: 2 },
      );
      this.worker.on('failed', (job, err) => {
        this.logger.error(`BullMQ job ${job?.id} failed: ${err.message}`);
      });
      this.logger.log(`Jobs worker listening on ${JOB_QUEUE_NAME}`);
    } catch (error) {
      this.logger.error(
        `Failed to start BullMQ (${error instanceof Error ? error.message : 'unknown'}). Falling back to inline.`,
      );
      await this.worker?.close().catch(() => undefined);
      await this.queue?.close().catch(() => undefined);
      await this.workerConnection?.quit().catch(() => undefined);
      await this.queueConnection?.quit().catch(() => undefined);
      this.queue = null;
      this.worker = null;
      this.queueConnection = null;
      this.workerConnection = null;
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.workerConnection?.quit().catch(() => undefined);
    await this.queueConnection?.quit().catch(() => undefined);
  }

  async create(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    type: JobType;
    payload: unknown;
    webhookUrl?: string;
    route?: string;
    idempotencyKey?: string;
  }) {
    if (input.idempotencyKey) {
      const existing = await this.prisma.job.findFirst({
        where: {
          organizationId: input.organizationId,
          idempotencyKey: input.idempotencyKey,
        },
      });
      if (existing) return this.toDto(existing);
    }

    let storedInput: Prisma.InputJsonValue;

    if (input.type === 'batch_translate') {
      const batch = this.parseBatchInput(input.payload);
      if (batch.items.length === 0) {
        throw new ApiException('validation_error', 'items must not be empty', HttpStatus.BAD_REQUEST);
      }
      if (batch.items.length > 100) {
        throw new ApiException('validation_error', 'Maximum 100 items per batch job', HttpStatus.BAD_REQUEST);
      }
      storedInput = batch as unknown as Prisma.InputJsonValue;
    } else if (input.type === 'document_translate') {
      storedInput = this.documents.parseDocumentInput(input.payload) as unknown as Prisma.InputJsonValue;
    } else if (input.type === 'workflow') {
      const workflow = await this.workflows.resolveJobInput({
        organizationId: input.organizationId,
        payload: input.payload,
      });
      storedInput = workflow as unknown as Prisma.InputJsonValue;
    } else if (input.type === 'dub') {
      storedInput = this.parseDubInput(input.payload) as unknown as Prisma.InputJsonValue;
    } else if (input.type === 'clone') {
      storedInput = this.parseCloneInput(input.payload) as unknown as Prisma.InputJsonValue;
    } else {
      throw new ApiException('validation_error', `Unsupported job type: ${input.type}`, HttpStatus.BAD_REQUEST);
    }

    if (input.webhookUrl && !/^https?:\/\//i.test(input.webhookUrl)) {
      throw new ApiException('validation_error', 'webhookUrl must be http(s)', HttpStatus.BAD_REQUEST);
    }

    const job = await this.prisma.job.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        type: input.type,
        status: 'queued',
        input: storedInput,
        webhookUrl: input.webhookUrl,
        webhookStatus: input.webhookUrl ? 'pending' : null,
        idempotencyKey: input.idempotencyKey,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      action: 'job.created',
      route: input.route ?? 'POST /v1/jobs',
      metadata: { jobId: job.id, type: job.type },
    });

    await this.enqueue(job.id);
    return this.toDto(job);
  }

  async get(organizationId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, organizationId },
    });
    if (!job) {
      throw new ApiException('not_found', 'Job not found', HttpStatus.NOT_FOUND);
    }
    return this.toDto(job);
  }

  async list(organizationId: string, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 100);
    const jobs = await this.prisma.job.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return jobs.map((job) => this.toDto(job));
  }

  async enqueue(jobId: string) {
    if (this.queue) {
      await this.queue.add(
        'process',
        { jobId },
        { jobId, removeOnComplete: 100, removeOnFail: 100 },
      );
      return;
    }
    setImmediate(() => {
      void this.processJob(jobId).catch((error) => {
        this.logger.error(
          `Inline job ${jobId} failed: ${error instanceof Error ? error.message : error}`,
        );
      });
    });
  }

  /** Public for tests — runs the same processor path as the worker. */
  async processJob(jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return;
    if (job.status === 'succeeded' || job.status === 'running') return;

    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'running',
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    try {
      let result:
        | BatchTranslateResult
        | DocumentTranslateResult
        | WorkflowResult
        | DubJobResult
        | CloneJobResult;
      if (job.type === 'batch_translate') {
        result = await this.runBatchTranslate(job);
      } else if (job.type === 'document_translate') {
        result = await this.documents.runDocumentTranslate(job);
      } else if (job.type === 'workflow') {
        result = await this.workflows.run(job);
      } else if (job.type === 'dub') {
        result = await this.runDub(job);
      } else if (job.type === 'clone') {
        result = await this.runClone(job);
      } else {
        throw new Error(`Unsupported job type: ${job.type}`);
      }

      const updated = await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'succeeded',
          result: result as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
          error: null,
        },
      });

      if (updated.webhookUrl) {
        const delivery = await this.webhooks.deliver({
          organizationId: updated.organizationId,
          webhookUrl: updated.webhookUrl,
          event: 'job.succeeded',
          data: this.toDto(updated),
        });
        await this.prisma.job.update({
          where: { id: jobId },
          data: { webhookStatus: delivery.ok ? 'delivered' : 'failed' },
        });
      } else {
        void this.webhooks
          .deliverPartnerEvent({
            organizationId: updated.organizationId,
            event: 'job.succeeded',
            data: this.toDto(updated),
          })
          .catch(() => undefined);
      }

      await this.audit.record({
        organizationId: job.organizationId,
        action: 'job.succeeded',
        route: 'jobs.worker',
        metadata: { jobId },
      });

      void this.notifications.notifyJobComplete({
        organizationId: job.organizationId,
        jobId,
        type: job.type,
        status: 'succeeded',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Job failed';
      const updated = await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: message,
          completedAt: new Date(),
        },
      });

      if (updated.webhookUrl) {
        const delivery = await this.webhooks.deliver({
          organizationId: updated.organizationId,
          webhookUrl: updated.webhookUrl,
          event: 'job.failed',
          data: this.toDto(updated),
        });
        await this.prisma.job.update({
          where: { id: jobId },
          data: { webhookStatus: delivery.ok ? 'delivered' : 'failed' },
        });
      } else {
        void this.webhooks
          .deliverPartnerEvent({
            organizationId: updated.organizationId,
            event: 'job.failed',
            data: this.toDto(updated),
          })
          .catch(() => undefined);
      }

      await this.audit.record({
        organizationId: job.organizationId,
        action: 'job.failed',
        route: 'jobs.worker',
        metadata: { jobId, error: message },
      });

      void this.notifications.notifyJobComplete({
        organizationId: job.organizationId,
        jobId,
        type: job.type,
        status: 'failed',
        error: message,
      });
    }
  }

  private async runBatchTranslate(job: {
    id: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId: string | null;
    input: Prisma.JsonValue;
  }): Promise<BatchTranslateResult> {
    const batch = this.parseBatchInput(job.input);
    const items: BatchTranslateResult['items'] = [];
    let characters = 0;
    let provider = 'unknown';

    for (const item of batch.items) {
      try {
        const translated = await this.translate.translate({
          text: item.text,
          source: batch.source,
          target: batch.target,
          organizationId: job.organizationId,
          workspaceId: job.workspaceId,
          apiKeyId: job.apiKeyId ?? undefined,
        });
        provider = translated.provider;
        characters += translated.characters;
        items.push({
          id: item.id,
          text: translated.text,
          characters: translated.characters,
        });
      } catch (error) {
        items.push({
          id: item.id,
          text: '',
          characters: 0,
          error: error instanceof Error ? error.message : 'translate failed',
        });
      }
    }

    return { items, provider, characters };
  }

  private parseBatchInput(payload: unknown): BatchTranslateInput {
    if (!payload || typeof payload !== 'object') {
      throw new ApiException('validation_error', 'Invalid batch payload', HttpStatus.BAD_REQUEST);
    }
    const body = payload as Record<string, unknown>;
    if (typeof body.source !== 'string' || typeof body.target !== 'string') {
      throw new ApiException('validation_error', 'source and target are required', HttpStatus.BAD_REQUEST);
    }
    if (!Array.isArray(body.items)) {
      throw new ApiException('validation_error', 'items must be an array', HttpStatus.BAD_REQUEST);
    }
    const items = body.items.map((raw, index) => {
      if (!raw || typeof raw !== 'object') {
        throw new ApiException('validation_error', `items[${index}] invalid`, HttpStatus.BAD_REQUEST);
      }
      const item = raw as Record<string, unknown>;
      const id = typeof item.id === 'string' ? item.id : String(index);
      const text = typeof item.text === 'string' ? item.text : '';
      if (!text) {
        throw new ApiException('validation_error', `items[${index}].text is required`, HttpStatus.BAD_REQUEST);
      }
      return { id, text };
    });
    return { source: body.source, target: body.target, items };
  }

  private parseDubInput(payload: unknown): DubJobInput {
    if (!payload || typeof payload !== 'object') {
      throw new ApiException('validation_error', 'Invalid dub payload', HttpStatus.BAD_REQUEST);
    }
    const body = payload as Record<string, unknown>;
    const targetLanguage = typeof body.targetLanguage === 'string' ? body.targetLanguage.trim() : '';
    if (!targetLanguage) {
      throw new ApiException('validation_error', 'targetLanguage is required', HttpStatus.BAD_REQUEST);
    }
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) {
      throw new ApiException(
        'validation_error',
        'text is required for async dub jobs (upload audio via POST /v1/video-voice/dub for STT path)',
        HttpStatus.BAD_REQUEST,
      );
    }
    return {
      text,
      sourceLanguage: typeof body.sourceLanguage === 'string' ? body.sourceLanguage : 'auto',
      targetLanguage,
      voice: typeof body.voice === 'string' ? body.voice : undefined,
      mode: body.mode as DubJobInput['mode'],
      format: body.format === 'wav' ? 'wav' : 'mp3',
      commercial: Boolean(body.commercial),
    };
  }

  private parseCloneInput(payload: unknown): CloneJobInput {
    if (!payload || typeof payload !== 'object') {
      throw new ApiException('validation_error', 'Invalid clone payload', HttpStatus.BAD_REQUEST);
    }
    const body = payload as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    return {
      name,
      language: typeof body.language === 'string' ? body.language : undefined,
      consentConfirmed: Boolean(body.consentConfirmed ?? body.consentAttested),
      notes: typeof body.notes === 'string' ? body.notes : typeof body.consentNotes === 'string' ? body.consentNotes : undefined,
    };
  }

  private async runDub(job: {
    organizationId: string;
    workspaceId: string;
    apiKeyId: string | null;
    input: Prisma.JsonValue;
  }): Promise<DubJobResult> {
    const input = this.parseDubInput(job.input);
    const dubbed = await this.videoVoice.dub(
      {
        text: input.text,
        sourceLanguage: input.sourceLanguage,
        targetLanguage: input.targetLanguage,
        voice: input.voice,
        mode: input.mode,
        format: input.format,
        commercial: input.commercial,
      },
      {
        organizationId: job.organizationId,
        workspaceId: job.workspaceId,
        apiKeyId: job.apiKeyId ?? undefined,
      },
    );
    return {
      targetLanguage: input.targetLanguage,
      characters: [...(dubbed.dubbedText ?? input.text ?? '')].length,
      provider: dubbed.providers?.tts ?? 'verbalab',
      mode: dubbed.mode,
      mimeType: dubbed.mimeType,
      audioBase64: dubbed.audioBase64,
      honesty:
        'Async dub job completed text→translate→TTS path. Binary STT uploads remain on POST /v1/video-voice/dub.',
    };
  }

  private async runClone(job: {
    organizationId: string;
    workspaceId: string;
    input: Prisma.JsonValue;
  }): Promise<CloneJobResult> {
    const input = this.parseCloneInput(job.input);
    if (!input.consentConfirmed) {
      throw new ApiException(
        'validation_error',
        'consentConfirmed must be true for clone jobs',
        HttpStatus.BAD_REQUEST,
      );
    }
    const notes = (input.notes ?? '').trim();
    if (notes.length < 8) {
      throw new ApiException(
        'validation_error',
        'notes/consentNotes must describe consent basis (min 8 chars)',
        HttpStatus.BAD_REQUEST,
      );
    }
    // Voice clone enrollment still requires sample audio via the multipart API.
    // Job path reserves the name and returns next-step honesty for partners.
    const reserved = await this.voiceClones.reserveAsyncJob({
      organizationId: job.organizationId,
      workspaceId: job.workspaceId,
      name: input.name,
      language: input.language,
      consentNotes: notes,
    });
    return {
      cloneId: reserved.id,
      name: reserved.name,
      status: reserved.status,
      honesty:
        'Clone job reserved. Upload sample audio with POST /v1/voice-clones (consentAttested) to finish enrollment.',
    };
  }

  private toDto(job: {
    id: string;
    type: string;
    status: string;
    input: Prisma.JsonValue;
    result: Prisma.JsonValue | null;
    error: string | null;
    webhookUrl: string | null;
    webhookStatus: string | null;
    attempts: number;
    createdAt: Date;
    startedAt: Date | null;
    completedAt: Date | null;
  }) {
    return {
      id: job.id,
      type: job.type,
      status: job.status,
      input: job.input,
      result: job.result,
      error: job.error,
      webhookUrl: job.webhookUrl,
      webhookStatus: job.webhookStatus,
      attempts: job.attempts,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };
  }
}
