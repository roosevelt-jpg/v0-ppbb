
import { describe, expect, it } from 'vitest';
import { nationalVoiceRuntimeCatalog } from '../src/national-voice-runtime/national-voice-runtime.catalog';
import { CivicVoiceEvidenceService } from '../src/civic-voice-evidence/civic-voice-evidence.service';
import { MutualIntelligibilityService } from '../src/mutual-intelligibility/mutual-intelligibility.service';
import { InstitutionalVoiceService } from '../src/institutional-voice/institutional-voice.service';
import { OfflineMeshVoiceService } from '../src/offline-mesh-voice/offline-mesh-voice.service';
import { SovereignVoiceOsService } from '../src/sovereign-voice-os/sovereign-voice-os.service';
import { productFamiliesCatalog } from '../src/product-families/product-families.catalog';

const session = {
  organizationId: 'org_test',
  workspaceId: 'ws_test',
  userId: 'user_test',
  role: 'owner',
} as any;

const audit = { record: async () => ({}) } as any;

describe('Sovereign Voice OS pillars', () => {
  it('catalogs mark pillars shipped with capabilities', () => {
    const nvr = nationalVoiceRuntimeCatalog();
    expect(nvr.honesty.shipped).toBe(true);
    expect(nvr.capabilities.length).toBeGreaterThanOrEqual(5);
    const families = productFamiliesCatalog().products.map((p) => p.slug);
    for (const slug of [
      'sovereign-voice-os',
      'national-voice-runtime',
      'civic-voice-evidence',
      'mutual-intelligibility',
      'institutional-voice',
      'offline-mesh-voice',
    ]) {
      expect(families).toContain(slug);
    }
  });

  it('evidence chain append + verify', async () => {
    const svc = new CivicVoiceEvidenceService(audit);
    await svc.append(session, { utterance: 'Official broadcast', actor: 'moh', consentId: 'c1', watermarkTip: 'wm1' });
    await svc.append(session, { utterance: 'Follow-up statement', actor: 'moh' });
    const v = svc.verify(session.organizationId);
    expect(v.ok).toBe(true);
    expect(v.length).toBe(2);
  });

  it('mutual intelligibility bridges without english middleman flag', async () => {
    const svc = new MutualIntelligibilityService(audit);
    const out = await svc.bridge(session, {
      corridorId: 'eac',
      sourceLocale: 'rw',
      targetLocale: 'sw',
      text: 'Muraho',
    });
    expect(out.englishMiddleman).toBe(false);
    expect(out.bridgedText).toContain('eac');
  });

  it('institutional voice refuses off-policy then allows with corpus', async () => {
    const svc = new InstitutionalVoiceService(audit);
    await svc.registerAgency(session, { agencyId: 'moh-ke', name: 'MoH Kenya', voiceId: 'alloy' });
    const refused = await svc.speak(session, { agencyId: 'moh-ke', question: 'Who won the football match?' });
    expect(refused.refused).toBe(true);
    await svc.ingest(session, {
      agencyId: 'moh-ke',
      title: 'Gazette 12',
      body: 'Childhood vaccination is free at all public clinics nationwide.',
    });
    const allowed = await svc.speak(session, { agencyId: 'moh-ke', question: 'Is childhood vaccination free?' });
    expect(allowed.allowed).toBe(true);
    expect(String(allowed.answer)).toMatch(/vaccination/i);
  });

  it('offline mesh sync drains queue', async () => {
    const svc = new OfflineMeshVoiceService(audit);
    await svc.registerNode(session, { nodeId: 'clinic-1', site: 'Clinic', country: 'KE' });
    await svc.enqueue(session, { nodeId: 'clinic-1', kind: 'stt', payload: 'a.wav' });
    const sync = await svc.sync(session, { nodeId: 'clinic-1' });
    expect(sync.synced).toBe(1);
  });

  it('sovereign OS compose returns five-pillar recipe', async () => {
    const svc = new SovereignVoiceOsService(audit);
    const recipe = await svc.compose(session, { countryCode: 'NG', sectors: 'health,justice', corridors: 'ecowas' });
    expect(recipe.steps.length).toBeGreaterThanOrEqual(4);
    expect(svc.pillars().count).toBe(5);
    expect(svc.readiness().checklist.length).toBeGreaterThan(3);
  });
});
