import { describe, expect, it } from 'vitest';
import {
  productFamiliesCatalog,
  productFamiliesHonesty,
} from '../src/product-families/product-families.catalog';
import { creditsFor } from '../src/billing/credits';

describe('product family readiness + dubbing credits', () => {
  it('covers VerbaCreative, VerbaAgents, VerbaAPI, and Resources with no broken footer cores', () => {
    const catalog = productFamiliesCatalog();
    expect(catalog.families).toEqual(['VerbaCreative', 'VerbaAgents', 'VerbaAPI', 'Resources']);
    const byFamily = Object.fromEntries(
      catalog.families.map((f) => [f, catalog.products.filter((p) => p.family === f)]),
    );
    expect(byFamily.VerbaCreative.length).toBeGreaterThanOrEqual(14);
    expect(byFamily.VerbaAgents.length).toBeGreaterThanOrEqual(14);
    expect(byFamily.VerbaAPI.length).toBeGreaterThanOrEqual(12);
    expect(byFamily.Resources.length).toBe(8);

    const broken = catalog.products.filter((p) => p.status === 'broken');
    expect(broken).toEqual([]);

    const mustShip = [
      'text-to-speech',
      'speech-to-text',
      'dubbing',
      'dubbing-api',
      'voice-cloning',
      'translate-api',
      'api-key',
      'conversational-ai',
      'voice-agents',
      'voice-bridges',
      'text-to-sound-effects',
      'ai-music-generator',
      'playground',
      'marketplace',
      'enterprise',
      'trust-center',
      'coverage',
      'developers',
      'docs',
      'openapi-explorer',
    ];
    for (const slug of mustShip) {
      const row = catalog.products.find((p) => p.slug === slug);
      expect(row, slug).toBeTruthy();
      expect(row!.status).toBe('shipped_e2e');
      expect(row!.api).toBeTruthy();
      expect(row!.consoleHref.startsWith('/')).toBe(true);
    }
  });

  it('wires dubbing to POST /v1/video-voice/dub with mode credit rates', () => {
    const dub = productFamiliesCatalog().products.find((p) => p.slug === 'dubbing');
    expect(dub?.api).toBe('POST /v1/video-voice/dub');
    expect(creditsFor('dubbing_auto_watermark', 1)).toBe(2000);
    expect(creditsFor('dubbing_auto', 1)).toBe(3000);
    expect(creditsFor('dubbing_studio_watermark', 1)).toBe(5000);
    expect(creditsFor('dubbing_studio', 1)).toBe(10000);
    expect(productFamiliesHonesty().commercialFrom).toBe('starter');
    expect(productFamiliesHonesty().professionalVoiceCloningFrom).toBe('creator');
  });

  it('keeps image/video honesty as partial', () => {
    const image = productFamiliesCatalog().products.find((p) => p.slug === 'ai-image-generator');
    const video = productFamiliesCatalog().products.find((p) => p.slug === 'ai-video-generator');
    expect(image?.status).toBe('partial');
    expect(video?.status).toBe('partial');
  });
});
