import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { TranslateService } from '../translate/translate.service';
import { WebhookService } from '../jobs/webhook.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SlackConnectorService } from './slack.service';
import {
  CONNECTOR_REGISTRY,
  CONNECTOR_TYPES,
  ConnectorInstallation,
  ConnectorType,
  isConnectorType,
} from './connectors.types';

@Injectable()
export class ConnectorsService {
  private readonly logger = new Logger(ConnectorsService.name);
  private readonly installations = new Map<string, ConnectorInstallation>();

  constructor(
    private readonly slack: SlackConnectorService,
    private readonly translate: TranslateService,
    private readonly webhooks: WebhookService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  listTypes() {
    return {
      types: CONNECTOR_REGISTRY,
      count: CONNECTOR_REGISTRY.length,
      honesty: {
        multiConnectorApis: true,
        slackLive: true,
        webhookHttpDiscordEmail: true,
        zapierIpaasOs: false,
        note: 'Shipped multi-connector install/invoke for slack, webhook, http, discord, email. Not a Zapier/iPaaS OS.',
      },
      endpoints: {
        list: 'GET /v1/connectors',
        install: 'POST /v1/connectors/:type/install',
        invoke: 'POST /v1/connectors/:type/invoke',
        slackLegacy: {
          status: 'GET /v1/connectors/slack/status',
          installations: 'GET|POST /v1/connectors/slack/installations',
          commands: 'POST /v1/connectors/slack/commands',
          events: 'POST /v1/connectors/slack/events',
        },
      },
    };
  }

  private assertType(type: string): ConnectorType {
    const normalized = type.trim().toLowerCase();
    if (!isConnectorType(normalized)) {
      throw new ApiException(
        'validation_error',
        `type must be one of ${CONNECTOR_TYPES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return normalized;
  }

  listInstallations(organizationId: string, type?: string) {
    const filter = type ? this.assertType(type) : null;
    const rows = [...this.installations.values()].filter((row) => {
      if (row.organizationId !== organizationId) return false;
      if (filter && row.type !== filter) return false;
      return true;
    });
    return { installations: rows, count: rows.length };
  }

  async install(input: {
    type: string;
    organizationId: string;
    workspaceId: string;
    userId: string;
    role: string;
    label?: string;
    config?: Record<string, unknown>;
    ip?: string;
  }) {
    const type = this.assertType(input.type);
    if (input.role !== 'owner' && input.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can install connectors',
        HttpStatus.FORBIDDEN,
      );
    }

    const config = input.config ?? {};

    if (type === 'slack') {
      const teamId = String(config.teamId ?? '').trim();
      if (!teamId) {
        throw new ApiException('validation_error', 'config.teamId is required', HttpStatus.BAD_REQUEST);
      }
      const slackRow = await this.slack.upsertInstallation({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        teamId,
        teamName: typeof config.teamName === 'string' ? config.teamName : undefined,
        defaultTargetLang:
          typeof config.defaultTargetLang === 'string' ? config.defaultTargetLang : undefined,
        userId: input.userId,
        role: input.role,
        ip: input.ip,
      });
      const now = new Date().toISOString();
      const installation: ConnectorInstallation = {
        id: slackRow.id,
        type: 'slack',
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        label: input.label?.trim() || slackRow.teamName || teamId,
        config: {
          teamId: slackRow.teamId,
          teamName: slackRow.teamName,
          defaultTargetLang: slackRow.defaultTargetLang,
        },
        status: 'active',
        createdAt: slackRow.createdAt.toISOString(),
        updatedAt: now,
      };
      this.installations.set(installation.id, installation);
      return { installation, honesty: this.listTypes().honesty };
    }

    if (type === 'webhook' || type === 'http' || type === 'discord') {
      const url = String(config.url ?? config.webhookUrl ?? '').trim();
      if (!/^https?:\/\//i.test(url)) {
        throw new ApiException(
          'validation_error',
          'config.url must be an http(s) URL',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (type === 'email' || type === 'teams') {
      const to = String(config.to ?? config.email ?? '').trim();
      if (!to) {
        throw new ApiException(
          'validation_error',
          'config.to (email address) is required',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const now = new Date().toISOString();
    const installation: ConnectorInstallation = {
      id: randomUUID(),
      type,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      label: input.label?.trim() || `${type} connector`,
      config,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    this.installations.set(installation.id, installation);

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: `connector.${type}.installed`,
      route: `POST /v1/connectors/${type}/install`,
      ip: input.ip,
      metadata: { installationId: installation.id, type },
    });

    return { installation, honesty: this.listTypes().honesty };
  }

  async invoke(input: {
    type: string;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    installationId?: string;
    payload?: Record<string, unknown>;
    ip?: string;
  }) {
    const type = this.assertType(input.type);
    const payload = input.payload ?? {};
    const installation = input.installationId
      ? this.installations.get(input.installationId)
      : [...this.installations.values()].find(
          (row) =>
            row.organizationId === input.organizationId &&
            row.type === type &&
            row.status === 'active',
        );

    if (type === 'slack') {
      const text = String(payload.text ?? '').trim();
      const target = String(payload.target ?? payload.targetLang ?? 'en').trim() || 'en';
      if (!text) {
        throw new ApiException('validation_error', 'payload.text is required', HttpStatus.BAD_REQUEST);
      }
      const translated = await this.translate.translate({
        text,
        source: typeof payload.source === 'string' ? payload.source : 'auto',
        target,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        skipReview: true,
      });
      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'connector.slack.invoke',
        route: 'POST /v1/connectors/slack/invoke',
        ip: input.ip,
        metadata: { characters: translated.characters, target },
      });
      return {
        ok: true,
        type,
        result: {
          text: translated.text,
          source: translated.source,
          target: translated.target,
          provider: translated.provider,
        },
        installationId: installation?.id ?? null,
      };
    }

    if (type === 'webhook') {
      const url = String(
        payload.url ?? installation?.config.url ?? installation?.config.webhookUrl ?? '',
      ).trim();
      if (!/^https?:\/\//i.test(url)) {
        throw new ApiException(
          'validation_error',
          'url required on payload or installation',
          HttpStatus.BAD_REQUEST,
        );
      }
      const delivery = await this.webhooks.deliver({
        organizationId: input.organizationId,
        webhookUrl: url,
        event: String(payload.event ?? 'connector.webhook.invoke'),
        data: payload.data ?? payload,
      });
      return { ok: delivery.ok, type, result: delivery, installationId: installation?.id ?? null };
    }

    if (type === 'http') {
      const url = String(payload.url ?? installation?.config.url ?? '').trim();
      if (!/^https?:\/\//i.test(url)) {
        throw new ApiException(
          'validation_error',
          'url required on payload or installation',
          HttpStatus.BAD_REQUEST,
        );
      }
      const method = String(payload.method ?? installation?.config.method ?? 'POST').toUpperCase();
      try {
        const response = await fetch(url, {
          method: method === 'GET' ? 'GET' : 'POST',
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'VerbaLab-Connectors/1.0' },
          body: method === 'GET' ? undefined : JSON.stringify(payload.body ?? payload),
          signal: AbortSignal.timeout(10_000),
        });
        const text = await response.text();
        return {
          ok: response.ok,
          type,
          result: { status: response.status, body: text.slice(0, 4_000) },
          installationId: installation?.id ?? null,
        };
      } catch (error) {
        this.logger.warn(
          `HTTP connector failed: ${error instanceof Error ? error.message : error}`,
        );
        return {
          ok: false,
          type,
          result: { error: error instanceof Error ? error.message : 'http failed' },
          installationId: installation?.id ?? null,
        };
      }
    }

    if (type === 'discord') {
      const url = String(
        payload.url ?? installation?.config.url ?? installation?.config.webhookUrl ?? '',
      ).trim();
      if (!/^https?:\/\//i.test(url)) {
        throw new ApiException(
          'validation_error',
          'Discord webhook url required on payload or installation',
          HttpStatus.BAD_REQUEST,
        );
      }
      let content = String(payload.content ?? payload.text ?? '').trim();
      if (payload.translate === true || payload.target) {
        const translated = await this.translate.translate({
          text: content || 'Hello',
          source: typeof payload.source === 'string' ? payload.source : 'auto',
          target: String(payload.target ?? 'en'),
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          skipReview: true,
        });
        content = translated.text;
      }
      if (!content) {
        throw new ApiException(
          'validation_error',
          'payload.content or payload.text is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
          signal: AbortSignal.timeout(10_000),
        });
        return {
          ok: response.ok || response.status === 204,
          type,
          result: { status: response.status, content },
          installationId: installation?.id ?? null,
        };
      } catch (error) {
        return {
          ok: false,
          type,
          result: { error: error instanceof Error ? error.message : 'discord failed', content },
          installationId: installation?.id ?? null,
        };
      }
    }

    if (type === 'teams') {
      const text = String(payload.text ?? payload.message ?? '').trim();
      let translated = text;
      let provider = 'passthrough';
      if (text) {
        const result = await this.translate.translate({
          text,
          source: typeof payload.source === 'string' ? payload.source : 'auto',
          target: String(payload.target ?? 'en'),
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          skipReview: true,
        });
        translated = result.text;
        provider = result.provider;
      }
      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'connector.teams.invoke',
        route: 'POST /v1/connectors/teams/commands',
        ip: input.ip,
        metadata: { installationId: installation?.id ?? null, chars: text.length },
      });
      return {
        ok: true,
        type,
        result: {
          channel: 'teams',
          command: payload.command ?? 'translate',
          text,
          translated,
          provider,
        },
        installationId: installation?.id ?? null,
        note: 'Sandbox Teams translate command — not a full Teams bot OS.',
      };
    }

    // email
    const message = String(payload.message ?? payload.text ?? '').trim();
    if (!message) {
      throw new ApiException(
        'validation_error',
        'payload.message is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const subject = String(payload.subject ?? 'VerbaLab connector notify');
    const result = await this.notifications.notifyWorkflowMessage({
      organizationId: input.organizationId,
      jobId: `connector-${type}`,
      stepId: installation?.id ?? 'email',
      subject,
      message,
    });
    return {
      ok: Boolean(result),
      type,
      result: {
        delivered: Boolean(result),
        emailId: result?.id ?? null,
        to: installation?.config.to ?? null,
        subject,
        message,
      },
      installationId: installation?.id ?? null,
    };
  }
}
