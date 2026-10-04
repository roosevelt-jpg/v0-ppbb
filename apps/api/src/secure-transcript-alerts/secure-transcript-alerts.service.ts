import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SpeechRecognitionService } from '../speech-recognition/speech-recognition.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApiException } from '../common/errors/api-exception';
import {
  secureTranscriptAlertsCatalog,
  secureTranscriptAlertsHonesty,
} from './secure-transcript-alerts.catalog';

type OrgAuth = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  apiKeyId?: string;
  ip?: string;
};

type AlertRecord = {
  id: string;
  organizationId: string;
  protocol: string;
  channel: 'email' | 'sms';
  to: string;
  trustedName?: string;
  transcript: string;
  language?: string;
  receiptToken: string;
  deliveryStatus: string;
  deliveryId: string;
  createdAt: string;
};

const PROTOCOLS = [
  {
    id: 'trusted-contact',
    name: 'Trusted contact ping',
    description: 'Send a short sealed transcript summary to a pre-agreed email or phone.',
  },
  {
    id: 'distress-witness',
    name: 'Distress witness protocol',
    description: 'On distress cue, archive transcript and notify a safety contact with location/time context.',
  },
  {
    id: 'institutional-duty',
    name: 'Institutional duty of care',
    description: 'Org security desk receives transcript alert for regulated interviews under policy.',
  },
];

@Injectable()
export class SecureTranscriptAlertsService {
  private readonly alerts = new Map<string, AlertRecord>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly speech: SpeechRecognitionService,
    private readonly notifications: NotificationsService,
  ) {}

  engine() {
    return {
      ...secureTranscriptAlertsCatalog(),
      safety: secureTranscriptAlertsHonesty(),
      emailConfigured: this.notifications.isConfigured(),
      smsConfigured: this.notifications.isSmsConfigured(),
      protocolCount: PROTOCOLS.length,
      alerts: this.alerts.size,
    };
  }

  protocols() {
    return { protocols: PROTOCOLS, count: PROTOCOLS.length };
  }

  monitoring() {
    return { status: 'ready', honesty: secureTranscriptAlertsHonesty() };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
        action: { contains: 'secure-transcript' },
      },
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

  async overview(auth: OrgAuth) {
    return {
      session: {
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
      engine: this.engine(),
      protocols: this.protocols(),
      activity: await this.activity(auth.organizationId),
      links: {
        self: '/secure-transcript-alerts',
        docs: '/docs/SECURE_TRANSCRIPT_ALERTS.md',
        institutions: '/africa-institutions',
      },
    };
  }

  async protect(
    auth: OrgAuth,
    input: {
      file?: Express.Multer.File;
      text?: string;
      language?: string;
      channel?: string;
      to?: string;
      consentToken?: string;
      protocol?: string;
      trustedName?: string;
    },
  ) {
    const channel = (input.channel === 'sms' ? 'sms' : 'email') as 'email' | 'sms';
    const to = String(input.to ?? '').trim();
    if (!to) {
      throw new ApiException(
        'validation_error',
        'to (email or phone) is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!input.consentToken?.trim()) {
      throw new ApiException(
        'validation_error',
        'consentToken is required — this protocol only runs with explicit consent',
        HttpStatus.BAD_REQUEST,
      );
    }

    let transcript = String(input.text ?? '').trim();
    let language = input.language;
    if (!transcript) {
      if (!input.file) {
        throw new ApiException(
          'validation_error',
          'Provide audio file or text transcript',
          HttpStatus.BAD_REQUEST,
        );
      }
      const recognized = await this.speech.recognize({
        file: input.file,
        language,
        punctuate: true,
        capitalize: true,
        useWorkspaceVocabulary: true,
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        apiKeyId: auth.apiKeyId,
        userId: auth.userId,
        ip: auth.ip,
      });
      transcript = String(recognized.text ?? '').trim();
      language = language ?? recognized.language ?? undefined;
      if (!transcript) {
        throw new ApiException('validation_error', 'Could not transcribe audio', HttpStatus.BAD_REQUEST);
      }
    }

    const protocol = String(input.protocol ?? 'trusted-contact');
    const alertId = randomUUID();
    const receiptToken = `vsta.${alertId}.${createHash('sha256')
      .update(`${auth.organizationId}:${to}:${transcript}:${Date.now()}`)
      .digest('hex')
      .slice(0, 16)}`;
    const summary =
      transcript.length > 280 ? `${transcript.slice(0, 277)}...` : transcript;
    const subject = `VerbaLab secure transcript alert (${protocol})`;
    const message = [
      `VerbaLab secure alert`,
      `Protocol: ${protocol}`,
      input.trustedName ? `For: ${input.trustedName}` : null,
      `Language: ${language ?? 'auto'}`,
      `Receipt: ${receiptToken}`,
      '',
      'Transcript summary:',
      summary,
      '',
      'This message was sent under an explicit consent token. Verify with POST /v1/secure-transcript-alerts/verify',
    ]
      .filter(Boolean)
      .join('\n');

    const delivery = await this.notifications.notifySecureAlert({
      organizationId: auth.organizationId,
      channel,
      to,
      subject,
      message,
      consentToken: input.consentToken,
      metadata: { alertId, protocol },
    });

    const record: AlertRecord = {
      id: alertId,
      organizationId: auth.organizationId,
      protocol,
      channel,
      to,
      trustedName: input.trustedName,
      transcript,
      language,
      receiptToken,
      deliveryStatus: delivery.status,
      deliveryId: delivery.deliveryId,
      createdAt: new Date().toISOString(),
    };
    this.alerts.set(alertId, record);

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'secure-transcript-alerts.protect',
      route: 'POST /v1/secure-transcript-alerts/protect',
      ip: auth.ip,
      metadata: {
        alertId,
        channel,
        protocol,
        deliveryStatus: delivery.status,
        chars: transcript.length,
      } as never,
    });

    return {
      alert: {
        id: record.id,
        protocol: record.protocol,
        channel: record.channel,
        to: record.to,
        language: record.language,
        receiptToken: record.receiptToken,
        delivery,
        createdAt: record.createdAt,
      },
      transcript: {
        text: transcript,
        preview: summary,
      },
      note: 'Trusted contact notified under consent. Use verify to confirm the receipt token.',
    };
  }

  async notify(auth: OrgAuth, body: Record<string, unknown>) {
    const alertId = String(body.alertId ?? '').trim();
    const alert = this.alerts.get(alertId);
    if (!alert || alert.organizationId !== auth.organizationId) {
      throw new ApiException('not_found', 'alert not found', HttpStatus.NOT_FOUND);
    }
    const consentToken = String(body.consentToken ?? '').trim();
    if (!consentToken) {
      throw new ApiException('validation_error', 'consentToken is required', HttpStatus.BAD_REQUEST);
    }
    const summary =
      alert.transcript.length > 280 ? `${alert.transcript.slice(0, 277)}...` : alert.transcript;
    const delivery = await this.notifications.notifySecureAlert({
      organizationId: auth.organizationId,
      channel: alert.channel,
      to: alert.to,
      subject: `VerbaLab secure transcript alert (resend)`,
      message: `Resend receipt ${alert.receiptToken}\n\n${summary}`,
      consentToken,
      metadata: { alertId },
    });
    alert.deliveryStatus = delivery.status;
    alert.deliveryId = delivery.deliveryId;
    this.alerts.set(alertId, alert);
    return { alertId, delivery, receiptToken: alert.receiptToken };
  }

  async verify(auth: OrgAuth, body: Record<string, unknown>) {
    const alertId = String(body.alertId ?? '').trim();
    const receiptToken = String(body.receiptToken ?? '').trim();
    let alert = alertId ? this.alerts.get(alertId) : undefined;
    if (!alert && receiptToken) {
      alert = [...this.alerts.values()].find((a) => a.receiptToken === receiptToken);
    }
    if (!alert || alert.organizationId !== auth.organizationId) {
      return { valid: false, message: 'Alert receipt not found' };
    }
    const tokenOk = !receiptToken || receiptToken === alert.receiptToken;
    return {
      valid: tokenOk,
      alert: {
        id: alert.id,
        protocol: alert.protocol,
        channel: alert.channel,
        deliveryStatus: alert.deliveryStatus,
        createdAt: alert.createdAt,
        language: alert.language,
      },
      message: tokenOk ? 'Authentic VerbaLab secure alert receipt' : 'Receipt token mismatch',
    };
  }
}
