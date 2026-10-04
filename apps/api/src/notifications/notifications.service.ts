import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailProvider, SendEmailInput, SendEmailResult } from './email-provider';
import { ResendAdapter } from './resend.adapter';
import {
  EMAIL_TEMPLATE_CATALOG,
  EmailBrandOptions,
  EmailTemplateId,
  defaultCopyrightText,
  emailAssetBaseUrl,
  previewEmailTemplate,
  renderJobCompleteEmail,
  renderMemberAddedEmail,
  renderSecureAlertEmail,
  renderUsageThresholdEmail,
  renderWorkflowMessageEmail,
} from './email-templates';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private provider: EmailProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    this.provider = new ResendAdapter(
      process.env.RESEND_API_KEY ?? '',
      process.env.EMAIL_FROM ?? '',
    );
  }

  /** Test hook only. */
  setProviderForTests(provider: EmailProvider) {
    this.provider = provider;
  }

  isConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
  }

  private disabled(): boolean {
    return process.env.NOTIFICATIONS_DISABLED === '1';
  }

  private consoleBase() {
    return (process.env.WEB_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.verbalab.ai').replace(
      /\/$/,
      '',
    );
  }

  private absoluteAssetUrl(pathOrUrl: string | null | undefined): string | undefined {
    const value = (pathOrUrl ?? '').trim();
    if (!value) return undefined;
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    const base = emailAssetBaseUrl();
    return `${base}${value.startsWith('/') ? value : `/${value}`}`;
  }

  /** Brand assets from CMS site settings (falls back to defaults). */
  async emailBrand(): Promise<EmailBrandOptions> {
    try {
      const settings = await this.prisma.cmsSiteSettings.findUnique({ where: { id: 'default' } });
      const brandName = settings?.brandName?.trim() || 'VerbaLab';
      return {
        brandName,
        logoUrl:
          this.absoluteAssetUrl(settings?.emailLogoUrl) ??
          this.absoluteAssetUrl(settings?.headerLogoUrl) ??
          `${emailAssetBaseUrl()}/email/verbalab-logo.png`,
        copyrightText: settings?.copyrightText?.trim() || defaultCopyrightText(brandName),
      };
    } catch {
      return {
        brandName: 'VerbaLab',
        logoUrl: `${emailAssetBaseUrl()}/email/verbalab-logo.png`,
        copyrightText: defaultCopyrightText(),
      };
    }
  }

  engine() {
    return {
      id: 'notifications',
      title: 'Notifications & email',
      provider: 'resend',
      configured: this.isConfigured(),
      disabled: this.disabled(),
      smsConfigured: this.isSmsConfigured(),
      env: {
        RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
        EMAIL_FROM: Boolean(process.env.EMAIL_FROM),
        NOTIFICATIONS_DISABLED: this.disabled(),
        TWILIO: this.isSmsConfigured(),
      },
      templates: EMAIL_TEMPLATE_CATALOG,
      triggers: [
        'job.succeeded / job.failed → owners/admins',
        'usage 80% / 100% quota → owners/admins',
        'member added → member email',
        'workflow/connector notify step → owners/admins',
        'secure transcript alerts → trusted contact',
      ],
      jobs: {
        queue: 'BullMQ (Redis) or JOBS_INLINE=1 in-process worker',
        cronOs: false,
        note: 'Async jobs are queue workers, not a Nest cron fleet. Global Scheduler catalogs schedules; it does not replace BullMQ.',
      },
      docs: '/docs/NOTIFICATIONS.md',
    };
  }

  templates() {
    return { templates: EMAIL_TEMPLATE_CATALOG, count: EMAIL_TEMPLATE_CATALOG.length };
  }

  async previewTemplate(id: string) {
    const known = EMAIL_TEMPLATE_CATALOG.some((t) => t.id === id);
    const templateId = (known ? id : 'workflow_message') as EmailTemplateId;
    const brand = await this.emailBrand();
    return { template: previewEmailTemplate(templateId, brand) };
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult | null> {
    if (this.disabled()) return null;
    if (!this.isConfigured() && this.provider.name === 'resend') {
      this.logger.debug('Email skipped — Resend not configured');
      return null;
    }
    return this.provider.send(input);
  }

  isSmsConfigured(): boolean {
    return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
  }

  /**
   * Secure alert delivery for transcript/security protocols.
   * Email via Resend when configured; SMS via Twilio when configured.
   * Always returns a delivery receipt (queued/sent/skipped) for auditability.
   */
  async notifySecureAlert(input: {
    organizationId: string;
    channel: 'email' | 'sms';
    to: string;
    subject: string;
    message: string;
    consentToken?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{
    channel: 'email' | 'sms';
    status: 'sent' | 'queued' | 'skipped';
    provider: string;
    deliveryId: string;
    note?: string;
  }> {
    if (this.disabled()) {
      return {
        channel: input.channel,
        status: 'skipped',
        provider: 'disabled',
        deliveryId: `skip_${Date.now()}`,
        note: 'NOTIFICATIONS_DISABLED=1',
      };
    }
    if (!input.consentToken?.trim()) {
      return {
        channel: input.channel,
        status: 'skipped',
        provider: 'policy',
        deliveryId: `noconsent_${Date.now()}`,
        note: 'consentToken required for secure alerts (human safety protocol)',
      };
    }

    if (input.channel === 'email') {
      try {
        const meta = input.metadata ?? {};
        const brand = await this.emailBrand();
        const rendered = renderSecureAlertEmail({
          protocol: String(meta.protocol ?? 'trusted-contact'),
          trustedName: meta.trustedName ? String(meta.trustedName) : undefined,
          language: meta.language ? String(meta.language) : undefined,
          receiptToken: String(meta.receiptToken ?? meta.alertId ?? 'pending'),
          summary: input.message.includes('Transcript summary:')
            ? input.message.split('Transcript summary:\n').slice(1).join('\n').trim() || input.message
            : input.message,
          consoleUrl: `${this.consoleBase()}/secure-transcript-alerts`,
          brand,
        });
        const result = await this.sendEmail({
          to: input.to,
          subject: input.subject || rendered.subject,
          text: rendered.text,
          html: rendered.html,
        });
        const deliveryId = result?.id ?? `email_queued_${Date.now()}`;
        const status = result ? ('sent' as const) : ('queued' as const);
        await this.audit.record({
          organizationId: input.organizationId,
          action: 'notification.secure_alert_email',
          route: 'notifications.secure_alert',
          metadata: {
            to: input.to,
            status,
            deliveryId,
            template: 'secure_alert',
            ...(input.metadata ?? {}),
          } as never,
        });
        return {
          channel: 'email',
          status,
          provider: result?.provider ?? 'resend',
          deliveryId,
          note: result ? undefined : 'Email provider not configured — receipt queued for deploy Resend credentials',
        };
      } catch (error) {
        this.logger.warn(`Secure email alert failed: ${error instanceof Error ? error.message : error}`);
        return {
          channel: 'email',
          status: 'queued',
          provider: 'resend',
          deliveryId: `email_err_${Date.now()}`,
          note: error instanceof Error ? error.message : 'send failed',
        };
      }
    }

    // SMS
    const to = input.to.trim();
    if (!to) {
      return {
        channel: 'sms',
        status: 'skipped',
        provider: 'twilio',
        deliveryId: `sms_bad_${Date.now()}`,
        note: 'destination phone required',
      };
    }
    if (!this.isSmsConfigured()) {
      const deliveryId = `sms_queued_${Date.now()}`;
      await this.audit.record({
        organizationId: input.organizationId,
        action: 'notification.secure_alert_sms_queued',
        route: 'notifications.secure_alert',
        metadata: {
          to,
          status: 'queued',
          deliveryId,
          preview: input.message.slice(0, 140),
          ...(input.metadata ?? {}),
        } as never,
      });
      return {
        channel: 'sms',
        status: 'queued',
        provider: 'twilio',
        deliveryId,
        note: 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER to send live SMS',
      };
    }

    try {
      const sid = process.env.TWILIO_ACCOUNT_SID!;
      const token = process.env.TWILIO_AUTH_TOKEN!;
      const from = process.env.TWILIO_FROM_NUMBER!;
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const body = new URLSearchParams({ To: to, From: from, Body: input.message.slice(0, 1500) });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });
      const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
      const deliveryId = json.sid ?? `sms_${Date.now()}`;
      const status = res.ok ? ('sent' as const) : ('queued' as const);
      await this.audit.record({
        organizationId: input.organizationId,
        action: 'notification.secure_alert_sms',
        route: 'notifications.secure_alert',
        metadata: {
          to,
          status,
          deliveryId,
          httpStatus: res.status,
          ...(input.metadata ?? {}),
        } as never,
      });
      return {
        channel: 'sms',
        status,
        provider: 'twilio',
        deliveryId,
        note: res.ok ? undefined : json.message ?? `Twilio HTTP ${res.status}`,
      };
    } catch (error) {
      this.logger.warn(`Secure SMS alert failed: ${error instanceof Error ? error.message : error}`);
      return {
        channel: 'sms',
        status: 'queued',
        provider: 'twilio',
        deliveryId: `sms_err_${Date.now()}`,
        note: error instanceof Error ? error.message : 'sms failed',
      };
    }
  }

  async notifyJobComplete(input: {
    organizationId: string;
    jobId: string;
    type: string;
    status: 'succeeded' | 'failed';
    error?: string;
  }) {
    if (this.disabled()) return;
    const recipients = await this.ownerAdminEmails(input.organizationId);
    if (recipients.length === 0) return;

    const brand = await this.emailBrand();
    const rendered = renderJobCompleteEmail({
      jobId: input.jobId,
      type: input.type,
      status: input.status,
      error: input.error,
      consoleUrl: `${this.consoleBase()}/jobs`,
      brand,
    });

    try {
      const result = await this.sendEmail({
        to: recipients,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      });
      if (!result) return;
      await this.audit.record({
        organizationId: input.organizationId,
        action: 'notification.job_complete_sent',
        route: 'jobs.worker',
        metadata: {
          jobId: input.jobId,
          status: input.status,
          provider: result.provider,
          emailId: result.id,
          template: rendered.id,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Job notification failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async maybeNotifyUsageThresholds(organizationId: string) {
    if (this.disabled()) return;

    try {
      const org = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, characterQuota: true, name: true },
      });
      if (!org || org.characterQuota <= 0) return;

      const periodStart = new Date();
      periodStart.setUTCDate(1);
      periodStart.setUTCHours(0, 0, 0, 0);

      const translateEvents = await this.prisma.usageEvent.findMany({
        where: {
          organizationId,
          feature: 'translate',
          createdAt: { gte: periodStart },
        },
        select: { units: true },
      });
      const characters = translateEvents.reduce((sum, event) => sum + event.units, 0);

      const thresholds: Array<{ pct: number; action: string }> = [
        { pct: 100, action: 'usage.threshold_100' },
        { pct: 80, action: 'usage.threshold_80' },
      ];

      for (const threshold of thresholds) {
        const triggerAt = Math.ceil((org.characterQuota * threshold.pct) / 100);
        if (characters < triggerAt) continue;

        const already = await this.prisma.auditEvent.findFirst({
          where: {
            organizationId,
            action: threshold.action,
            createdAt: { gte: periodStart },
          },
          select: { id: true },
        });
        if (already) continue;

        const recipients = await this.ownerAdminEmails(organizationId);
        if (recipients.length === 0) {
          await this.audit.record({
            organizationId,
            action: threshold.action,
            route: 'notifications.usage',
            metadata: { characters, quota: org.characterQuota, emailed: false },
          });
          continue;
        }

        try {
          const brand = await this.emailBrand();
          const rendered = renderUsageThresholdEmail({
            organizationName: org.name,
            characters,
            quota: org.characterQuota,
            pct: threshold.pct,
            consoleUrl: `${this.consoleBase()}/usage`,
            brand,
          });
          const result = await this.sendEmail({
            to: recipients,
            subject: rendered.subject,
            text: rendered.text,
            html: rendered.html,
          });

          await this.audit.record({
            organizationId,
            action: threshold.action,
            route: 'notifications.usage',
            metadata: {
              characters,
              quota: org.characterQuota,
              emailed: Boolean(result),
              emailId: result?.id,
              template: rendered.id,
            },
          });

          if (result) {
            await this.audit.record({
              organizationId,
              action: 'notification.usage_threshold_sent',
              route: 'notifications.usage',
              metadata: { threshold: threshold.pct, emailId: result.id, template: rendered.id },
            });
          }
        } catch (error) {
          this.logger.warn(
            `Usage threshold notification failed: ${error instanceof Error ? error.message : error}`,
          );
        }
      }
    } catch (error) {
      // Fire-and-forget from translate; ignore teardown / disconnect races in tests.
      this.logger.debug(
        `Usage threshold check skipped: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async notifyMemberAdded(input: {
    organizationId: string;
    organizationName: string;
    email: string;
    role: string;
  }) {
    if (this.disabled() || !input.email) return;

    try {
      const brand = await this.emailBrand();
      const rendered = renderMemberAddedEmail({
        organizationName: input.organizationName,
        role: input.role,
        consoleUrl: this.consoleBase(),
        brand,
      });
      const result = await this.sendEmail({
        to: input.email,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      });
      if (!result) return;
      await this.audit.record({
        organizationId: input.organizationId,
        action: 'notification.member_added_sent',
        route: 'identity.ensureSession',
        metadata: {
          email: input.email,
          role: input.role,
          emailId: result.id,
          template: rendered.id,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Member-added notification failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /** Explicit workflow notify step (owners/admins). */
  async notifyWorkflowMessage(input: {
    organizationId: string;
    jobId: string;
    stepId: string;
    subject: string;
    message: string;
  }) {
    if (this.disabled()) return null;
    const recipients = await this.ownerAdminEmails(input.organizationId);
    if (recipients.length === 0) return null;

    try {
      const brand = await this.emailBrand();
      const rendered = renderWorkflowMessageEmail({
        subject: input.subject,
        message: input.message,
        jobId: input.jobId,
        consoleUrl: `${this.consoleBase()}/workflows`,
        brand,
      });
      const result = await this.sendEmail({
        to: recipients,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      });
      if (!result) return null;
      await this.audit.record({
        organizationId: input.organizationId,
        action: 'notification.workflow_step_sent',
        route: 'jobs.worker',
        metadata: {
          jobId: input.jobId,
          stepId: input.stepId,
          provider: result.provider,
          emailId: result.id,
          template: rendered.id,
        },
      });
      return result;
    } catch (error) {
      this.logger.warn(
        `Workflow notify failed: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async sendTestEmail(input: {
    organizationId: string;
    to: string;
    templateId?: string;
    userId?: string;
  }) {
    if (!this.isConfigured() && this.provider.name === 'resend') {
      return {
        sent: false,
        note: 'Set RESEND_API_KEY and EMAIL_FROM first',
        engine: this.engine(),
      };
    }
    const preview = (await this.previewTemplate(input.templateId ?? 'member_added')).template;
    const result = await this.sendEmail({
      to: input.to,
      subject: `[TEST] ${preview.subject}`,
      text: preview.text,
      html: preview.html,
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'notification.test_sent',
      route: 'POST /v1/notifications/test',
      metadata: {
        to: input.to,
        template: preview.id,
        emailId: result?.id ?? null,
      } as never,
    });
    return {
      sent: Boolean(result),
      emailId: result?.id ?? null,
      provider: result?.provider ?? 'resend',
      template: preview.id,
    };
  }

  private async ownerAdminEmails(organizationId: string): Promise<string[]> {
    const members = await this.prisma.membership.findMany({
      where: {
        organizationId,
        role: { in: ['owner', 'admin'] },
      },
      include: { user: { select: { email: true } } },
    });
    return [
      ...new Set(
        members
          .map((m) => m.user.email?.trim())
          .filter((email): email is string => Boolean(email)),
      ),
    ];
  }
}
