import { describe, expect, it } from 'vitest';
import { aiInternetHonesty } from '../src/ai-internet-store/ai-internet-honesty';
import { aiInternetDefaultSeeds } from '../src/ai-internet-store/ai-internet-store.seed';
import { createEventFabricBroker } from '../src/event-fabric/broker-adapters';

describe('Volume 25 AI Internet', () => {
  it('honesty forbids global internet / OS claims', () => {
    const h = aiInternetHonesty();
    expect(h.aiInternetProtocolSoftware).toBe(true);
    expect(h.runsGlobalAiInternet).toBe(false);
    expect(h.globalOperatingSystemClaims).toBe(false);
    expect(h.credentialsConfiguredSeparately).toBe(true);
  });

  it('seeds cover multiple domains', () => {
    const seeds = aiInternetDefaultSeeds();
    expect(seeds.length).toBeGreaterThan(10);
    const domains = new Set(seeds.map((s) => s.domain));
    expect(domains.has('dns')).toBe(true);
    expect(domains.has('federation')).toBe(true);
    expect(domains.has('credentials')).toBe(true);
  });

  it('event fabric broker adapters are selectable', async () => {
    const redis = createEventFabricBroker();
    expect(redis.name).toBe('redis_streams');
    const pub = await redis.publish({ topic: 'vl.test', payload: { ok: true } });
    expect(pub.ok).toBe(true);
  });
});
