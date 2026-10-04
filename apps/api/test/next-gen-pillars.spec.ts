import { describe, expect, it } from 'vitest';
import { ComplianceAttestationsService } from '../src/compliance-attestations/compliance-attestations.service';
import { VoicePassportService } from '../src/voice-passport/voice-passport.service';
import { IndustryDropsService } from '../src/industry-drops/industry-drops.service';
import { EdgeOfflineService } from '../src/edge-offline/edge-offline.service';
import { DeveloperGravityService } from '../src/developer-gravity/developer-gravity.service';
import { AfricaEvalMatrixService } from '../src/africa-eval-matrix/africa-eval-matrix.service';
import { SovereignFlywheelService } from '../src/sovereign-flywheel/sovereign-flywheel.service';
import { VerbaVoiceService } from '../src/verba-voice/verba-voice.service';

const session = {
  organizationId: 'org_test',
  workspaceId: 'ws_test',
  userId: 'user_test',
  role: 'owner',
} as const;

function stubPrisma() {
  return {
    auditEvent: {
      findMany: async () => [],
    },
  } as never;
}

function stubAudit() {
  return { record: async () => ({}) } as never;
}

describe('Next-gen pillars 1-8', () => {
  it('issues and verifies compliance attestations + DPA', async () => {
    const svc = new ComplianceAttestationsService(stubPrisma(), stubAudit());
    const issued = await svc.issue(session as never, {
      industry: 'banking',
      framework: 'POPIA',
      region: 'af',
    });
    const verified = await svc.verify(session as never, {
      attestationId: issued.attestation.id,
      token: issued.attestation.token,
    });
    const dpa = await svc.dpa(session as never, {
      industry: 'healthcare',
      counterparty: 'Acme',
    });
    expect(verified.valid).toBe(true);
    expect(dpa.dpa.frameworks.length).toBeGreaterThan(0);
    expect(svc.engine().honesty.shipped).toBe(true);
  });

  it('runs voice passport trust checks', async () => {
    const svc = new VoicePassportService(stubPrisma(), stubAudit());
    const issued = await svc.issue(session as never, {
      holderName: 'Amina',
      country: 'SN',
      scopes: 'tts,clone',
    });
    await svc.endorse(session as never, {
      passportId: issued.passport.id,
      endorser: 'Elder',
    });
    const check = await svc.check(session as never, {
      passportId: issued.passport.id,
      purpose: 'voice_clone',
      country: 'SN',
    });
    expect(check.allowed).toBe(true);
  });

  it('installs industry drops and passes eval gate', async () => {
    const svc = new IndustryDropsService(stubPrisma(), stubAudit());
    const installed = await svc.install(session as never, { packId: 'banking-af' });
    await svc.configure(session as never, {
      installId: installed.install.id,
      languages: 'en,sw',
    });
    const evaled = await svc.evaluate(session as never, { installId: installed.install.id });
    expect(evaled.gate.passed).toBe(true);
    expect(svc.packs().count).toBe(5);
  });

  it('opens verba voice duplex webrtc with barge-in', async () => {
    const voice = new VerbaVoiceService(
      stubPrisma(),
      stubAudit(),
      {} as never,
      {} as never,
      {} as never,
    );
    const auth = {
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
    };
    const opened = await voice.sessions(auth, { language: 'sw' });
    const sessionId = String((opened as { session: { id: string } }).session.id);
    const rtc = await voice.webrtc(auth, { sessionId });
    expect(rtc.duplex.mode).toBe('webrtc');
    const signal = await voice.webrtcSignal(auth, {
      sessionId,
      kind: 'offer',
      sdp: 'v=0',
    });
    expect(signal.duplex.hasLocal).toBe(true);
    const barge = await voice.bargeIn(auth, { sessionId, action: 'interrupt' });
    expect(barge.speaking).toBe('user');
    expect(voice.engine().honesty.duplexWebRtc).toBe(true);
  });

  it('builds and signs edge offline packs', async () => {
    const svc = new EdgeOfflineService(stubPrisma(), stubAudit());
    const built = await svc.build(session as never, {
      models: 'echo,voice-fm',
      locales: 'sw,yo',
    });
    const signed = await svc.sign(session as never, { packId: built.pack.id });
    const verified = await svc.verify(session as never, {
      packId: built.pack.id,
      checksum: built.pack.checksum,
    });
    expect(signed.pack.signature).toBeTruthy();
    expect(verified.valid).toBe(true);
  });

  it('creates developer gravity sandbox and quickstart', async () => {
    const svc = new DeveloperGravityService(stubPrisma(), stubAudit());
    const sandbox = await svc.sandbox(session as never, { name: 'hack', tier: 'trial' });
    const qs = await svc.quickstart(session as never, {
      language: 'typescript',
      product: 'verba-voice',
    });
    expect(sandbox.apiKey.startsWith('vl_test_')).toBe(true);
    expect(qs.snippet).toContain('VERBALAB_API_KEY');
  });

  it('scores africa eval matrix WER', async () => {
    const svc = new AfricaEvalMatrixService(stubPrisma(), stubAudit());
    const scored = await svc.score(session as never, {
      language: 'sw',
      hypothesis: 'karibu benki',
      reference: 'karibu benki',
    });
    expect(scored.metrics.wer).toBe(0);
    expect(svc.matrix().count).toBeGreaterThan(0);
  });

  it('runs sovereign flywheel ingest→promote', async () => {
    const svc = new SovereignFlywheelService(stubPrisma(), stubAudit());
    const ingested = await svc.ingest(session as never, {
      language: 'ha',
      consentToken: 'cns_demo',
    });
    await svc.curate(session as never, { datasetId: ingested.dataset.id, minQuality: 0.7 });
    const job = await svc.finetune(session as never, {
      datasetId: ingested.dataset.id,
      baseModel: 'atlas',
    });
    const promoted = await svc.promote(session as never, { jobId: job.job.id });
    expect(promoted.job.status).toBe('promoted');
    expect(promoted.modelKeyHint.startsWith('vmod_')).toBe(true);
  });
});
