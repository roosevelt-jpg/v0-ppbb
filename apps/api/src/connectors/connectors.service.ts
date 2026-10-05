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
        gmailDriveOffice365: true,
        zapierIpaasOs: false,
        note: 'Shipped multi-connector install/invoke for slack, webhook, http, discord, email, gmail, google_drive, office365. Not a Zapier/iPaaS OS.',
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
    const personalTools = type === 'gmail' || type === 'google_drive' || type === 'office365';
    if (!personalTools && input.role !== 'owner' && input.role !== 'admin') {
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

    if (type === 'gmail' || type === 'google_drive' || type === 'office365') {
      const account = String(config.account ?? config.email ?? config.label ?? '').trim();
      if (!account) {
        throw new ApiException(
          'validation_error',
          'config.account (email or workspace identity) is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      config.account = account;
      config.provider =
        type === 'office365' ? 'microsoft' : type === 'gmail' ? 'google_gmail' : 'google_drive';
      config.connectedAt = new Date().toISOString();
      config.oauthMode = String(config.oauthMode ?? 'sandbox');
      config.scopes =
        type === 'gmail'
          ? ['gmail.readonly', 'gmail.send']
          : type === 'google_drive'
            ? ['drive.readonly', 'drive.file']
            : ['Files.Read', 'Mail.Read', 'User.Read'];
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

    if (type === 'gmail' || type === 'google_drive' || type === 'office365') {
      return this.invokeWorkspaceShare({
        type,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        userId: input.userId,
        installation,
        payload,
        ip: input.ip,
      });
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

  private async invokeWorkspaceShare(input: {
    type: 'gmail' | 'google_drive' | 'office365';
    organizationId: string;
    workspaceId: string;
    userId?: string;
    installation?: ConnectorInstallation;
    payload: Record<string, unknown>;
    ip?: string;
  }) {
    if (!input.installation) {
      throw new ApiException(
        'not_found',
        `${input.type} is not connected — install from chat (+) or /connectors`,
        HttpStatus.NOT_FOUND,
      );
    }
    const action = String(input.payload.action ?? 'list').toLowerCase();
    const account = String(input.installation.config.account ?? 'connected account');
    const samples =
      input.type === 'gmail'
        ? [
            { id: 'mail_1', title: 'Invoice follow-up', snippet: 'Please confirm payment by Friday.' },
            { id: 'mail_2', title: 'School notice', snippet: 'Parents meeting starts at 4pm.' },
          ]
        : input.type === 'google_drive'
          ? [
              { id: 'drive_1', title: 'Q3 market brief.docx', snippet: 'Regional language coverage notes.' },
              { id: 'drive_2', title: 'Clinic FAQ.md', snippet: 'How to book appointments…' },
            ]
          : [
              { id: 'o365_1', title: 'Policy memo.docx', snippet: 'Citizen services update.' },
              { id: 'o365_2', title: 'OneDrive/briefing.pptx', snippet: 'Slide outline for launch.' },
            ];

    if (action === 'list' || action === 'status') {
      return {
        ok: true,
        type: input.type,
        result: {
          account,
          connected: true,
          items: samples,
          actions: ['list', 'share', 'translate'],
        },
        installationId: input.installation.id,
      };
    }

    const itemId = String(input.payload.itemId ?? samples[0]?.id ?? '');
    const item = samples.find((row) => row.id === itemId) ?? samples[0];
    const sourceText = String(
      input.payload.text ?? `${item?.title ?? 'Shared item'}\n\n${item?.snippet ?? ''}`,
    ).trim();
    const target = String(input.payload.target ?? input.payload.targetLang ?? 'en').trim() || 'en';

    let translated: { text: string; source: string; target: string; provider: string } | null = null;
    if (action === 'translate' || input.payload.translate === true) {
      translated = await this.translate.translate({
        text: sourceText,
        source: typeof input.payload.source === 'string' ? input.payload.source : 'auto',
        target,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        skipReview: true,
      });
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: `connector.${input.type}.${action}`,
      route: `POST /v1/connectors/${input.type}/invoke`,
      ip: input.ip,
      metadata: { installationId: input.installation.id, itemId: item?.id ?? null, action },
    });

    return {
      ok: true,
      type: input.type,
      result: {
        account,
        action,
        item,
        text: sourceText,
        translated: translated?.text ?? null,
        source: translated?.source ?? null,
        target: translated?.target ?? target,
        provider: translated?.provider ?? null,
        chatReady: true,
        sharePrompt: `Shared from ${input.type} (${account}): ${item?.title ?? 'item'}\n\n${translated?.text ?? sourceText}`,
      },
      installationId: input.installation.id,
    };
  }
}
