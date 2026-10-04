import { describe, expect, it } from 'vitest';
import { AfricaInstitutionsService } from '../src/africa-institutions/africa-institutions.service';
import { SecureTranscriptAlertsService } from '../src/secure-transcript-alerts/secure-transcript-alerts.service';
import { JusticeLanguageAccessService } from '../src/justice-language-access/justice-language-access.service';
import { CivicTruthGuardService } from '../src/civic-truth-guard/civic-truth-guard.service';
import { CivicVoiceSealService } from '../src/civic-voice-seal/civic-voice-seal.service';

const session = {
  organizationId: 'org_test',
  workspaceId: 'ws_test',
  userId: 'user_test',
  role: 'owner',
} as const;

function stubPrisma() {
  return {
    auditEvent: { findMany: async () => [] },
  } as never;
}

function stubAudit() {
  return { record: async () => ({}) } as never;
}

describe('Africa institutions — security, justice, truth', () => {
  it('routes culture/sovereignty/justice needs to pillars', async () => {
    const svc = new AfricaInstitutionsService(stubPrisma(), stubAudit());
    const routed = await svc.route(session as never, {
      need: 'help justice court language barrier defendant',
    });
    expect(routed.pillar.id).toBe('justice');
    expect(svc.pillars().count).toBeGreaterThanOrEqual(5);
  });

  it('protects with secure transcript email alert under consent', async () => {
    const notifications = {
      isConfigured: () => false,
      isSmsConfigured: () => false,
      notifySecureAlert: async () => ({
        channel: 'email',
        status: 'queued',
        provider: 'resend',
        deliveryId: 'email_queued_1',
        note: 'queued',
      }),
    };
    const speech = { recognize: async () => ({ text: 'help', language: 'en' }) };
    const svc = new SecureTranscriptAlertsService(
      stubPrisma(),
      stubAudit(),
      speech as never,
      notifications as never,
    );
    const out = await svc.protect(
      {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        userId: session.userId,
      },
      {
        text: 'I need help now — please send this to my sister.',
        channel: 'email',
        to: 'sister@example.org',
        consentToken: 'cns_demo',
        protocol: 'trusted-contact',
      },
    );
    expect(out.alert.receiptToken.startsWith('vsta.')).toBe(true);
    expect(out.alert.delivery.status).toBe('queued');
    const verified = await svc.verify(
      { organizationId: session.organizationId, workspaceId: session.workspaceId },
      { alertId: out.alert.id, receiptToken: out.alert.receiptToken },
    );
    expect(verified.valid).toBe(true);
  });

  it('builds justice dual-language brief', async () => {
    const translate = {
      translate: async (input: { text: string; target: string }) => ({
        text: `[${input.target}] ${input.text}`,
      }),
    };
    const svc = new JusticeLanguageAccessService(stubPrisma(), stubAudit(), translate as never);
    const brief = await svc.brief(session as never, {
      testimony: 'Sijaelewa mashtaka.',
      speakerLanguage: 'sw',
      courtLanguage: 'en',
      country: 'KE',
    });
    expect(brief.brief.dualLanguage.court).toContain('[en]');
    const rights = await svc.rights(session as never, {
      country: 'KE',
      speakerLanguage: 'sw',
      courtLanguage: 'en',
    });
    expect(rights.rights.plain.courtLanguage).toContain('fair');
  });

  it('flags high-risk fake news style claims', async () => {
    const seals = new CivicVoiceSealService(stubPrisma(), stubAudit());
    const svc = new CivicTruthGuardService(stubPrisma(), stubAudit(), seals);
    const assessed = await svc.assess(session as never, {
      claim: 'BREAKING — share before deleted. This AI voice proves the minister said pay now.',
      speakerName: 'Minister Example',
      url: 'https://bit.ly/forwarded',
    });
    expect(assessed.assessment.riskLevel === 'high' || assessed.assessment.riskLevel === 'medium').toBe(
      true,
    );
    const report = await svc.report(session as never, {
      assessmentId: assessed.assessment.id,
    });
    expect(report.report.fingerprint.startsWith('vctg.')).toBe(true);
  });
});
