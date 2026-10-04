import { describe, expect, it } from 'vitest';
import {
  creditsFor,
  creditsForSttSeconds,
  creditsForTtsCharacters,
  CREDIT_RATES,
  API_USD_RATES,
} from '../src/billing/credits';
import { PLANS, planCatalog, planMeets, isPaidPlan } from '../src/billing/plans';

describe('ElevenLabs-mirrored billing credits + plans', () => {
  it('exposes Free→Business ladder with EL-class credit pools', () => {
    const ids = planCatalog().map((p) => p.id);
    expect(ids).toEqual([
      'free',
      'starter',
      'creator',
      'pro',
      'scale',
      'business',
      'enterprise',
    ]);
    expect(PLANS.free.monthlyCredits).toBe(10_000);
    expect(PLANS.starter.monthlyCredits).toBe(30_000);
    expect(PLANS.creator.monthlyCredits).toBe(121_000);
    expect(PLANS.pro.monthlyCredits).toBe(600_000);
    expect(PLANS.scale.monthlyCredits).toBe(1_800_000);
    expect(PLANS.business.monthlyCredits).toBe(6_000_000);
    expect(PLANS.starter.priceUsdMonthly).toBe(5);
    expect(PLANS.pro.priceUsdMonthly).toBe(99);
  });

  it('mirrors product credit rates', () => {
    expect(CREDIT_RATES.tts.creditsPerUnit).toBe(1);
    expect(CREDIT_RATES.tts_flash.creditsPerUnit).toBe(0.5);
    expect(CREDIT_RATES.stt.creditsPerUnit).toBe(330);
    expect(creditsForTtsCharacters(1000, false)).toBe(1000);
    expect(creditsForTtsCharacters(1000, true)).toBe(500);
    expect(creditsForSttSeconds(60, false)).toBe(330);
    expect(creditsFor('sfx', 1)).toBe(200);
    expect(API_USD_RATES.ttsMultilingualPer1kChars).toBe(0.1);
    expect(API_USD_RATES.sttPerHour).toBe(0.22);
  });

  it('treats Starter+ as paid and Creator above Starter', () => {
    expect(isPaidPlan('free')).toBe(false);
    expect(isPaidPlan('starter')).toBe(true);
    expect(isPaidPlan('pro')).toBe(true);
    expect(planMeets('creator', 'starter')).toBe(true);
    expect(planMeets('starter', 'creator')).toBe(false);
    expect(planMeets('business', 'pro')).toBe(true);
  });
});
