import { describe, expect, it } from 'vitest';
import { DialectContinuumService } from '../src/dialect-continuum/dialect-continuum.service';
import { VoiceTrustGraphService } from '../src/voice-trust-graph/voice-trust-graph.service';
import { CivicVoiceSealService } from '../src/civic-voice-seal/civic-voice-seal.service';
import { OralKnowledgeService } from '../src/oral-knowledge/oral-knowledge.service';
import { IntentPreservingDubService } from '../src/intent-preserving-dub/intent-preserving-dub.service';

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

function stubTranslate() {
  return {
    translate: async (input: { text: string; target: string }) => ({
      text: `[${input.target}] ${input.text}`,
      source: 'auto',
      target: input.target,
      provider: 'stub',
      characters: input.text.length,
    }),
  } as never;
}

describe('Frontier moonshot products', () => {
  it('detects dialect continuum spectrum', async () => {
    const svc = new DialectContinuumService(stubPrisma(), stubAudit());
    const out = await svc.detect(session as never, { text: 'no wahala my brother, wakha' }, undefined);
    expect(out.spectrum.length).toBeGreaterThan(0);
    expect(out.codeSwitch).toBeTypeOf('boolean');
  });

  it('builds voice trust consent and check', async () => {
    const svc = new VoiceTrustGraphService(stubPrisma(), stubAudit());
    const a = await svc.nodes(session as never, { name: 'Amina', kind: 'person', country: 'SN' });
    const b = await svc.nodes(session as never, { name: 'Studio', kind: 'org', country: 'SN' });
    const edge = await svc.consent(session as never, {
      fromNodeId: a.node.id,
      toNodeId: b.node.id,
      purpose: 'voice_clone',
      country: 'SN',
    });
    await svc.witness(session as never, { edgeId: edge.edge.id, witnessName: 'Elder' });
    const check = await svc.check(session as never, {
      fromNodeId: a.node.id,
      toNodeId: b.node.id,
      purpose: 'voice_clone',
      country: 'SN',
    });
    expect(check.allowed).toBe(true);
  });

  it('issues and verifies civic voice seals', async () => {
    const svc = new CivicVoiceSealService(stubPrisma(), stubAudit());
    const issued = await svc.issue(session as never, { subjectName: 'Spokesperson', country: 'KE' });
    const verified = await svc.verify(session as never, { token: issued.token });
    expect(verified.authentic).toBe(true);
    expect(verified.underBudget).toBe(true);
  });

  it('ingests and queries oral knowledge with consent', async () => {
    const svc = new OralKnowledgeService(stubPrisma(), stubAudit());
    const ingested = await svc.ingest(session as never, {
      title: 'Market tale',
      transcript: 'Elders said millet prices rise after rain.',
      speakerConsent: true,
      collection: 'elders',
      sourceKind: 'elder',
    });
    const q = await svc.query(session as never, { question: 'millet prices' });
    expect(ingested.item.id).toBeTruthy();
    expect(q.citations.length).toBeGreaterThan(0);
  });

  it('scores intent-preserving dub social effect', async () => {
    const svc = new IntentPreservingDubService(stubPrisma(), stubAudit(), stubTranslate());
    const dubbed = await svc.dub(session as never, {
      text: 'Mheshimiwa, inshallah — haha!',
      target: 'en',
    });
    const score = await svc.score(session as never, {
      sourceText: 'Mheshimiwa, inshallah — haha!',
      dubbed: dubbed.dubbed,
    });
    expect(score.socialEffect).toBeGreaterThan(0);
  });
});
