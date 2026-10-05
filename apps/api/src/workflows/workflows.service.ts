import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { AudioService } from '../audio/audio.service';
import { TranslateService } from '../translate/translate.service';
import { DocumentsService } from '../documents/documents.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebhookService } from '../jobs/webhook.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ChatService } from '../chat/chat.service';
import { AiOrchestrationService } from '../ai-orchestration/ai-orchestration.service';
import {
  WORKFLOW_MAX_STEPS,
  WORKFLOW_OPS,
  WorkflowInput,
  WorkflowOp,
  WorkflowResult,
  WorkflowStep,
  WorkflowStepResult,
} from './workflow.types';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly audio: AudioService,
    private readonly translate: TranslateService,
    private readonly documents: DocumentsService,
    private readonly notifications: NotificationsService,
    private readonly webhooks: WebhookService,
    private readonly embeddings: EmbeddingsService,
    private readonly chat: ChatService,
    private readonly orchestration: AiOrchestrationService,
  ) {}

  async list(organizationId: string, workspaceId: string) {
    const rows = await this.prisma.workflow.findMany({
      where: { organizationId, workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => this.toDto(row));
  }

  async get(organizationId: string, workflowId: string) {
    const row = await this.prisma.workflow.findFirst({
      where: { id: workflowId, organizationId },
    });
    if (!row) {
      throw new ApiException('not_found', 'Workflow not found', HttpStatus.NOT_FOUND);
    }
    return this.toDto(row);
  }

  async create(input: {
    organizationId: string;
    workspaceId: string;
    name: string;
    steps: unknown;
    userId?: string;
    route?: string;
  }) {
    const name = input.name.trim();
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    const steps = this.parseSteps(input.steps);
    const row = await this.prisma.workflow.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        name,
        steps: steps as unknown as Prisma.InputJsonValue,
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'workflow.created',
      route: input.route ?? 'POST /v1/workflows',
      metadata: { workflowId: row.id, steps: steps.length },
    });
    return this.toDto(row);
  }

  async remove(input: {
    organizationId: string;
    workflowId: string;
    userId?: string;
    role: string;
  }) {
    if (input.role !== 'owner' && input.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can delete workflows',
        HttpStatus.FORBIDDEN,
      );
    }
    const row = await this.prisma.workflow.findFirst({
      where: { id: input.workflowId, organizationId: input.organizationId },
    });
    if (!row) {
      throw new ApiException('not_found', 'Workflow not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.workflow.delete({ where: { id: row.id } });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'workflow.deleted',
      route: 'DELETE /v1/workflows/:id',
      metadata: { workflowId: row.id },
    });
    return { deleted: true, id: row.id };
  }

  parseWorkflowInput(payload: unknown): WorkflowInput {
    if (!payload || typeof payload !== 'object') {
      throw new ApiException('validation_error', 'Invalid workflow payload', HttpStatus.BAD_REQUEST);
    }
    const body = payload as Record<string, unknown>;
    const workflowId = typeof body.workflowId === 'string' ? body.workflowId : undefined;
    const name = typeof body.name === 'string' ? body.name : undefined;
    const steps = this.parseSteps(body.steps);
    return { workflowId, name, steps };
  }

  async resolveJobInput(input: {
    organizationId: string;
    payload: unknown;
  }): Promise<WorkflowInput> {
    const body =
      input.payload && typeof input.payload === 'object'
        ? (input.payload as Record<string, unknown>)
        : {};

    if (typeof body.workflowId === 'string' && !Array.isArray(body.steps)) {
      const def = await this.get(input.organizationId, body.workflowId);
      return {
        workflowId: def.id,
        name: def.name,
        steps: def.steps as WorkflowStep[],
      };
    }

    return this.parseWorkflowInput(input.payload);
  }

  parseSteps(raw: unknown): WorkflowStep[] {
    if (!Array.isArray(raw)) {
      throw new ApiException('validation_error', 'steps must be an array', HttpStatus.BAD_REQUEST);
    }
    if (raw.length === 0) {
      throw new ApiException('validation_error', 'steps must not be empty', HttpStatus.BAD_REQUEST);
    }
    if (raw.length > WORKFLOW_MAX_STEPS) {
      throw new ApiException(
        'validation_error',
        `Maximum ${WORKFLOW_MAX_STEPS} steps per workflow`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const seen = new Set<string>();
    const steps: WorkflowStep[] = [];

    for (let i = 0; i < raw.length; i++) {
      const item = raw[i];
      if (!item || typeof item !== 'object') {
        throw new ApiException('validation_error', `steps[${i}] invalid`, HttpStatus.BAD_REQUEST);
      }
      const step = item as Record<string, unknown>;
      const id = typeof step.id === 'string' ? step.id.trim() : '';
      if (!id) {
        throw new ApiException('validation_error', `steps[${i}].id is required`, HttpStatus.BAD_REQUEST);
      }
      if (seen.has(id)) {
        throw new ApiException('validation_error', `Duplicate step id: ${id}`, HttpStatus.BAD_REQUEST);
      }
      seen.add(id);

      const op = step.op;
      if (typeof op !== 'string' || !WORKFLOW_OPS.includes(op as WorkflowOp)) {
        throw new ApiException(
          'validation_error',
          `steps[${i}].op must be one of ${WORKFLOW_OPS.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (op === 'transcribe' || op === 'stt') {
        const documentId = typeof step.documentId === 'string' ? step.documentId.trim() : '';
        if (!documentId) {
          throw new ApiException(
            'validation_error',
            `steps[${i}].documentId is required`,
            HttpStatus.BAD_REQUEST,
          );
        }
        steps.push({
          id,
          op,
          documentId,
          language: typeof step.language === 'string' ? step.language : undefined,
        });
      } else if (op === 'translate') {
        if (typeof step.source !== 'string' || typeof step.target !== 'string') {
          throw new ApiException(
            'validation_error',
            `steps[${i}] requires source and target`,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (typeof step.text !== 'string' || !step.text.trim()) {
          throw new ApiException(
            'validation_error',
            `steps[${i}].text is required`,
            HttpStatus.BAD_REQUEST,
          );
        }
        steps.push({
          id,
          op: 'translate',
          source: step.source,
          target: step.target,
          text: step.text,
        });
      } else if (op === 'notify') {
        const channel = step.channel;
        if (channel !== 'email' && channel !== 'webhook') {
          throw new ApiException(
            'validation_error',
            `steps[${i}].channel must be email or webhook`,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (typeof step.message !== 'string' || !step.message.trim()) {
          throw new ApiException(
            'validation_error',
            `steps[${i}].message is required`,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (channel === 'webhook') {
          const webhookUrl = typeof step.webhookUrl === 'string' ? step.webhookUrl : '';
          if (!/^https?:\/\//i.test(webhookUrl)) {
            throw new ApiException(
              'validation_error',
              `steps[${i}].webhookUrl must be http(s)`,
              HttpStatus.BAD_REQUEST,
            );
          }
          steps.push({
            id,
            op: 'notify',
            channel: 'webhook',
            message: step.message,
            subject: typeof step.subject === 'string' ? step.subject : undefined,
            webhookUrl,
          });
        } else {
          steps.push({
            id,
            op: 'notify',
            channel: 'email',
            message: step.message,
            subject: typeof step.subject === 'string' ? step.subject : undefined,
          });
        }
      } else if (op === 'embed') {
        if (typeof step.text !== 'string' || !step.text.trim()) {
          throw new ApiException(
            'validation_error',
            `steps[${i}].text is required`,
            HttpStatus.BAD_REQUEST,
          );
        }
        steps.push({
          id,
          op: 'embed',
          text: step.text,
          model: typeof step.model === 'string' ? step.model : undefined,
        });
      } else if (op === 'summarize') {
        if (typeof step.text !== 'string' || !step.text.trim()) {
          throw new ApiException(
            'validation_error',
            `steps[${i}].text is required`,
            HttpStatus.BAD_REQUEST,
          );
        }
        const maxSentences =
          typeof step.maxSentences === 'number' && step.maxSentences > 0
            ? Math.min(8, Math.floor(step.maxSentences))
            : 3;
        steps.push({ id, op: 'summarize', text: step.text, maxSentences });
      } else if (op === 'webhook') {
        const webhookUrl = typeof step.webhookUrl === 'string' ? step.webhookUrl : '';
        if (!/^https?:\/\//i.test(webhookUrl)) {
          throw new ApiException(
            'validation_error',
            `steps[${i}].webhookUrl must be http(s)`,
            HttpStatus.BAD_REQUEST,
          );
        }
        steps.push({
          id,
          op: 'webhook',
          webhookUrl,
          event: typeof step.event === 'string' ? step.event : undefined,
          message: typeof step.message === 'string' ? step.message : undefined,
          data:
            step.data && typeof step.data === 'object'
              ? (step.data as Record<string, unknown>)
              : undefined,
        });
      } else if (op === 'classify') {
        if (typeof step.text !== 'string' || !step.text.trim()) {
          throw new ApiException(
            'validation_error',
            `steps[${i}].text is required`,
            HttpStatus.BAD_REQUEST,
          );
        }
        const labels = Array.isArray(step.labels)
          ? step.labels.filter((l): l is string => typeof l === 'string' && l.trim().length > 0)
          : [];
        if (labels.length === 0) {
          throw new ApiException(
            'validation_error',
            `steps[${i}].labels must be a non-empty string array`,
            HttpStatus.BAD_REQUEST,
          );
        }
        steps.push({ id, op: 'classify', text: step.text, labels });
      } else if (op === 'agent_run') {
        if (typeof step.goal !== 'string' || !step.goal.trim()) {
          throw new ApiException(
            'validation_error',
            `steps[${i}].goal is required`,
            HttpStatus.BAD_REQUEST,
          );
        }
        steps.push({
          id,
          op: 'agent_run',
          goal: step.goal,
          pipeline: typeof step.pipeline === 'string' ? step.pipeline : undefined,
        });
      } else if (op === 'tts') {
        if (typeof step.text !== 'string' || !step.text.trim()) {
          throw new ApiException(
            'validation_error',
            `steps[${i}].text is required`,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (typeof step.voice !== 'string' || !step.voice.trim()) {
          throw new ApiException(
            'validation_error',
            `steps[${i}].voice is required`,
            HttpStatus.BAD_REQUEST,
          );
        }
        const format =
          step.format === 'wav' ||
          step.format === 'opus' ||
          step.format === 'aac' ||
          step.format === 'flac' ||
          step.format === 'mp3'
            ? step.format
            : 'mp3';
        steps.push({
          id,
          op: 'tts',
          text: step.text,
          voice: step.voice,
          language: typeof step.language === 'string' ? step.language : undefined,
          format,
        });
      }
    }

    return steps;
  }

  async run(job: {
    id: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId: string | null;
    input: Prisma.JsonValue;
  }): Promise<WorkflowResult> {
    const input = this.parseWorkflowInput(job.input);
    const context = new Map<string, Record<string, unknown>>();
    const stepResults: WorkflowStepResult[] = [];

    for (const step of input.steps) {
      const output = await this.runStep(step, {
        organizationId: job.organizationId,
        workspaceId: job.workspaceId,
        apiKeyId: job.apiKeyId,
        jobId: job.id,
        context,
      });
      context.set(step.id, output);
      stepResults.push({ id: step.id, op: step.op, output });
    }

    return {
      workflowId: input.workflowId ?? null,
      name: input.name ?? null,
      steps: stepResults,
    };
  }

  private async runTranscribeLike(
    step: Extract<WorkflowStep, { op: 'transcribe' | 'stt' }>,
    ctx: {
      organizationId: string;
      workspaceId: string;
      apiKeyId: string | null;
    },
  ): Promise<Record<string, unknown>> {
    const { doc, buffer } = await this.documents.readOwnedBuffer(
      ctx.organizationId,
      step.documentId,
    );
    const transcribed = await this.audio.transcribe({
      file: {
        fieldname: 'file',
        originalname: doc.filename,
        encoding: '7bit',
        mimetype: doc.mimeType,
        size: buffer.length,
        buffer,
        destination: '',
        filename: doc.filename,
        path: '',
        stream: undefined as never,
      } as Express.Multer.File,
      language: step.language,
      organizationId: ctx.organizationId,
      workspaceId: ctx.workspaceId,
      apiKeyId: ctx.apiKeyId ?? undefined,
    });
    return {
      text: transcribed.text,
      language: transcribed.language,
      durationSeconds: transcribed.durationSeconds,
      provider: transcribed.provider,
      documentId: doc.id,
    };
  }

  private async runStep(
    step: WorkflowStep,
    ctx: {
      organizationId: string;
      workspaceId: string;
      apiKeyId: string | null;
      jobId: string;
      context: Map<string, Record<string, unknown>>;
    },
  ): Promise<Record<string, unknown>> {
    if (step.op === 'transcribe' || step.op === 'stt') {
      return this.runTranscribeLike(step, ctx);
    }

    if (step.op === 'translate') {
      const text = this.interpolate(step.text, ctx.context).trim();
      if (!text) {
        throw new Error(`Step ${step.id}: translated text resolved empty`);
      }
      const translated = await this.translate.translate({
        text,
        source: step.source,
        target: step.target,
        organizationId: ctx.organizationId,
        workspaceId: ctx.workspaceId,
        apiKeyId: ctx.apiKeyId ?? undefined,
      });
      return {
        text: translated.text,
        source: translated.source,
        target: translated.target,
        characters: translated.characters,
        provider: translated.provider,
      };
    }

    if (step.op === 'embed') {
      const text = this.interpolate(step.text, ctx.context).trim();
      const embedded = await this.embeddings.create({
        input: text,
        model: step.model,
        organizationId: ctx.organizationId,
        workspaceId: ctx.workspaceId,
        apiKeyId: ctx.apiKeyId ?? undefined,
      });
      const vector = embedded.data[0]?.embedding ?? [];
      return {
        text,
        dimensions: vector.length,
        embeddingPreview: vector.slice(0, 8),
        model: embedded.model,
        provider: embedded.provider,
        tokens: embedded.usage.total_tokens,
      };
    }

    if (step.op === 'summarize') {
      const text = this.interpolate(step.text, ctx.context).trim();
      const maxSentences = step.maxSentences ?? 3;
      const completion = await this.chat.completions({
        messages: [
          {
            role: 'user',
            content: `Summarize the following text in at most ${maxSentences} sentences. Return only the summary.\n\n${text}`,
          },
        ],
        organizationId: ctx.organizationId,
        workspaceId: ctx.workspaceId,
        apiKeyId: ctx.apiKeyId ?? undefined,
      });
      const summary =
        (completion as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]
          ?.message?.content ?? String((completion as { text?: string }).text ?? '');
      return { text: summary, sourceText: text, maxSentences };
    }

    if (step.op === 'classify') {
      const text = this.interpolate(step.text, ctx.context).trim();
      const labels = step.labels;
      const completion = await this.chat.completions({
        messages: [
          {
            role: 'user',
            content: `Classify the text into exactly one of these labels: ${labels.join(', ')}. Reply with only the label.\n\nText:\n${text}`,
          },
        ],
        organizationId: ctx.organizationId,
        workspaceId: ctx.workspaceId,
        apiKeyId: ctx.apiKeyId ?? undefined,
      });
      const raw =
        (completion as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]
          ?.message?.content ?? '';
      const normalized = raw.trim().toLowerCase();
      const matched =
        labels.find((l) => normalized === l.toLowerCase()) ??
        labels.find((l) => normalized.includes(l.toLowerCase())) ??
        labels[0]!;
      return { label: matched, raw, labels, text };
    }

    if (step.op === 'webhook') {
      const message = step.message ? this.interpolate(step.message, ctx.context) : undefined;
      const delivery = await this.webhooks.deliver({
        organizationId: ctx.organizationId,
        webhookUrl: step.webhookUrl,
        event: step.event ?? 'workflow.webhook',
        data: {
          jobId: ctx.jobId,
          stepId: step.id,
          message,
          ...(step.data ?? {}),
        },
      });
      return {
        channel: 'webhook',
        delivered: delivery.ok,
        status: delivery.status ?? null,
        error: delivery.error ?? null,
        message: message ?? null,
      };
    }

    if (step.op === 'agent_run') {
      const goal = this.interpolate(step.goal, ctx.context).trim();
      const result = await this.orchestration.run({
        organizationId: ctx.organizationId,
        workspaceId: ctx.workspaceId,
        apiKeyId: ctx.apiKeyId ?? undefined,
        pipeline: step.pipeline ?? 'detect_translate',
        text: goal,
      });
      return {
        goal,
        pipeline: step.pipeline ?? 'detect_translate',
        result,
      };
    }

    if (step.op === 'tts') {
      const text = this.interpolate(step.text, ctx.context).trim();
      const spoken = await this.audio.speak({
        text,
        voice: step.voice,
        language: step.language,
        format: step.format ?? 'mp3',
        organizationId: ctx.organizationId,
        workspaceId: ctx.workspaceId,
        apiKeyId: ctx.apiKeyId ?? undefined,
      });
      const audioBytes = spoken.audio?.length ?? 0;
      const base64 = spoken.audio ? Buffer.from(spoken.audio).toString('base64') : '';
      return {
        text,
        voice: spoken.voice ?? step.voice,
        provider: spoken.provider ?? null,
        format: spoken.format ?? step.format ?? 'mp3',
        characters: spoken.characters ?? text.length,
        audioBytes,
        audioBase64Preview: base64 ? base64.slice(0, 256) : null,
        truncatedPreview: base64.length > 256,
      };
    }

    // notify
    const message = this.interpolate(step.message, ctx.context);
    const subject = step.subject
      ? this.interpolate(step.subject, ctx.context)
      : `VerbaLab workflow notify (${ctx.jobId})`;

    if (step.channel === 'email') {
      const result = await this.notifications.notifyWorkflowMessage({
        organizationId: ctx.organizationId,
        jobId: ctx.jobId,
        stepId: step.id,
        subject,
        message,
      });
      return {
        channel: 'email',
        delivered: Boolean(result),
        emailId: result?.id ?? null,
        message,
      };
    }

    const delivery = await this.webhooks.deliver({
      organizationId: ctx.organizationId,
      webhookUrl: step.webhookUrl!,
      event: 'workflow.notify',
      data: {
        jobId: ctx.jobId,
        stepId: step.id,
        message,
        subject,
      },
    });
    return {
      channel: 'webhook',
      delivered: delivery.ok,
      message,
    };
  }

  /** Replace `{{stepId.field}}` with prior step outputs. */
  interpolate(template: string, context: Map<string, Record<string, unknown>>): string {
    return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\s*\}\}/g, (_m, stepId, field) => {
      const output = context.get(stepId);
      if (!output || !(field in output)) {
        throw new Error(`Unknown placeholder {{${stepId}.${field}}}`);
      }
      const value = output[field];
      if (value === null || value === undefined) return '';
      return String(value);
    });
  }

  private toDto(row: {
    id: string;
    name: string;
    steps: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      name: row.name,
      steps: row.steps,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      ops: WORKFLOW_OPS,
    };
  }
}
