/**
 * Subscription plans for VerbaLab public Creative Platform pricing
 * (credits, USD list prices, commercial/clone entitlements). VerbaLab brand + African residency.
 *
 * Plan ladder — Free / Starter / Creator / Pro / Scale / Business.
 */

export type PlanId =
  | 'free'
  | 'starter'
  | 'creator'
  | 'pro'
  | 'scale'
  | 'business'
  | 'enterprise';

export type PlanDefinition = {
  id: PlanId;
  name: string;
  /** Monthly shared credit pool (shared-credit). Stored on Organization.characterQuota. */
  characterQuota: number;
  /** Alias — same as characterQuota (credits). */
  monthlyCredits: number;
  /** List price USD / month (self-serve). Enterprise is null (custom). */
  priceUsdMonthly: number | null;
  /** Annual billed as 10× monthly (2 months free) — equivalent monthly. */
  priceUsdAnnualEffective: number | null;
  seats: number;
  rateLimitPerKey: number;
  rateLimitPerOrg: number;
  concurrency: number;
  commercialLicense: boolean;
  instantVoiceCloning: boolean;
  professionalVoiceCloning: boolean;
  professionalVoiceSlots: number;
  customVoiceSlots: number;
  priority: number;
  stripePriceEnv?:
    | 'STRIPE_PRICE_ID_STARTER'
    | 'STRIPE_PRICE_ID_CREATOR'
    | 'STRIPE_PRICE_ID_PRO'
    | 'STRIPE_PRICE_ID_SCALE'
    | 'STRIPE_PRICE_ID_BUSINESS';
  blurb: string;
  highlights: string[];
};

function envInt(name: string, fallback: number): number {
  const raw = Number(process.env[name] ?? fallback);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : fallback;
}

function definePlan(input: PlanDefinition): PlanDefinition {
  return {
    ...input,
    characterQuota: input.monthlyCredits,
  };
}

function freePlan(): PlanDefinition {
  return definePlan({
    id: 'free',
    name: 'Free',
    monthlyCredits: envInt(
      'BILLING_FREE_CREDITS',
      envInt('BILLING_FREE_CHARACTER_QUOTA', 10_000),
    ),
    characterQuota: 10_000,
    priceUsdMonthly: 0,
    priceUsdAnnualEffective: 0,
    seats: 1,
    rateLimitPerKey: envInt('RATE_LIMIT_FREE_PER_KEY', 20),
    rateLimitPerOrg: envInt('RATE_LIMIT_FREE_PER_ORG', 40),
    concurrency: 2,
    commercialLicense: false,
    instantVoiceCloning: false,
    professionalVoiceCloning: false,
    professionalVoiceSlots: 0,
    customVoiceSlots: 3,
    priority: 0,
    blurb: 'Explore VerbaLab voice — Text to Speech, Speech to Text, and Studio basics.',
    highlights: [
      '10k credits / month',
      'TTS · STT · Sound Effects · Voice Design',
      '3 custom voice slots (design)',
      'Non-commercial use',
    ],
  });
}

function starterPlan(): PlanDefinition {
  return definePlan({
    id: 'starter',
    name: 'Starter',
    monthlyCredits: envInt('BILLING_STARTER_CREDITS', 30_000),
    characterQuota: 30_000,
    priceUsdMonthly: 5,
    priceUsdAnnualEffective: 5, // annual ≈ 10× monthly / 12 → ~$5 listed equivalent
    seats: 1,
    rateLimitPerKey: envInt('RATE_LIMIT_STARTER_PER_KEY', 60),
    rateLimitPerOrg: envInt('RATE_LIMIT_STARTER_PER_ORG', 120),
    concurrency: 3,
    commercialLicense: true,
    instantVoiceCloning: true,
    professionalVoiceCloning: false,
    professionalVoiceSlots: 0,
    customVoiceSlots: 10,
    priority: 1,
    stripePriceEnv: 'STRIPE_PRICE_ID_STARTER',
    blurb: 'Commercial license + Instant Voice Cloning — Starter tier ($5/mo).',
    highlights: [
      '30k credits / month',
      'Commercial license',
      'Instant Voice Cloning',
      '20 Studio projects',
    ],
  });
}

function creatorPlan(): PlanDefinition {
  return definePlan({
    id: 'creator',
    name: 'Creator',
    monthlyCredits: envInt('BILLING_CREATOR_CREDITS', 121_000),
    characterQuota: 121_000,
    priceUsdMonthly: 22,
    priceUsdAnnualEffective: 18,
    seats: 1,
    rateLimitPerKey: envInt('RATE_LIMIT_CREATOR_PER_KEY', 120),
    rateLimitPerOrg: envInt('RATE_LIMIT_CREATOR_PER_ORG', 300),
    concurrency: 5,
    commercialLicense: true,
    instantVoiceCloning: true,
    professionalVoiceCloning: true,
    professionalVoiceSlots: 1,
    customVoiceSlots: 30,
    priority: 2,
    stripePriceEnv: 'STRIPE_PRICE_ID_CREATOR',
    blurb: 'Professional Voice Cloning + 121k credits — Creator tier ($22/mo; first month 50% off via Stripe coupon).',
    highlights: [
      '121k credits / month',
      'Professional Voice Cloning',
      'Additional credit top-ups',
      'Higher concurrency',
    ],
  });
}

function proPlan(): PlanDefinition {
  return definePlan({
    id: 'pro',
    name: 'Pro',
    monthlyCredits: envInt(
      'BILLING_PRO_CREDITS',
      envInt('BILLING_PRO_CHARACTER_QUOTA', 600_000),
    ),
    characterQuota: 600_000,
    priceUsdMonthly: 99,
    priceUsdAnnualEffective: 83,
    seats: 1,
    rateLimitPerKey: envInt('RATE_LIMIT_PRO_PER_KEY', 300),
    rateLimitPerOrg: envInt('RATE_LIMIT_PRO_PER_ORG', 1_000),
    concurrency: 10,
    commercialLicense: true,
    instantVoiceCloning: true,
    professionalVoiceCloning: true,
    professionalVoiceSlots: 3,
    customVoiceSlots: 60,
    priority: 3,
    stripePriceEnv: 'STRIPE_PRICE_ID_PRO',
    blurb: 'Production API volume — 44.1kHz PCM, higher quality audio, 600k credits.',
    highlights: [
      '600k credits / month',
      '44.1kHz PCM via API',
      '192kbps audio quality',
      'Production-grade rate limits',
    ],
  });
}

function scalePlan(): PlanDefinition {
  return definePlan({
    id: 'scale',
    name: 'Scale',
    monthlyCredits: envInt('BILLING_SCALE_CREDITS', 1_800_000),
    characterQuota: 1_800_000,
    priceUsdMonthly: 330,
    priceUsdAnnualEffective: 275,
    seats: 3,
    rateLimitPerKey: envInt('RATE_LIMIT_SCALE_PER_KEY', 600),
    rateLimitPerOrg: envInt('RATE_LIMIT_SCALE_PER_ORG', 2_000),
    concurrency: 15,
    commercialLicense: true,
    instantVoiceCloning: true,
    professionalVoiceCloning: true,
    professionalVoiceSlots: 3,
    customVoiceSlots: 120,
    priority: 4,
    stripePriceEnv: 'STRIPE_PRICE_ID_SCALE',
    blurb: 'Team seats + 1.8M credits — Scale tier for growing workspaces ($330/mo).',
    highlights: [
      '1.8M credits / month',
      '3 workspace seats',
      'Team collaboration',
      '3 Professional Voice Clones',
    ],
  });
}

function businessPlan(): PlanDefinition {
  return definePlan({
    id: 'business',
    name: 'Business',
    monthlyCredits: envInt('BILLING_BUSINESS_CREDITS', 6_000_000),
    characterQuota: 6_000_000,
    priceUsdMonthly: 1_320,
    priceUsdAnnualEffective: 1_100,
    seats: 10,
    rateLimitPerKey: envInt('RATE_LIMIT_BUSINESS_PER_KEY', 1_200),
    rateLimitPerOrg: envInt('RATE_LIMIT_BUSINESS_PER_ORG', 5_000),
    concurrency: 20,
    commercialLicense: true,
    instantVoiceCloning: true,
    professionalVoiceCloning: true,
    professionalVoiceSlots: 10,
    customVoiceSlots: 300,
    priority: 5,
    stripePriceEnv: 'STRIPE_PRICE_ID_BUSINESS',
    blurb: 'Low-latency TTS as low as ~5¢/minute equivalent + 6M credits ($1,320/mo).',
    highlights: [
      '6M credits / month',
      '10 workspace seats',
      'Low-latency TTS path',
      '10 Professional Voice Clones',
    ],
  });
}

function enterprisePlan(): PlanDefinition {
  return definePlan({
    id: 'enterprise',
    name: 'Enterprise',
    monthlyCredits: envInt('BILLING_ENTERPRISE_CREDITS', 50_000_000),
    characterQuota: 50_000_000,
    priceUsdMonthly: null,
    priceUsdAnnualEffective: null,
    seats: 25,
    rateLimitPerKey: envInt('RATE_LIMIT_ENTERPRISE_PER_KEY', 5_000),
    rateLimitPerOrg: envInt('RATE_LIMIT_ENTERPRISE_PER_ORG', 20_000),
    concurrency: 50,
    commercialLicense: true,
    instantVoiceCloning: true,
    professionalVoiceCloning: true,
    professionalVoiceSlots: 50,
    customVoiceSlots: 1_000,
    priority: 6,
    blurb: 'Custom terms, BAAs, SSO, elevated concurrency — contact sales.',
    highlights: [
      'Custom credit pools',
      'BAAs / DPA / SSO',
      'Elevated concurrency',
      'Priority support',
    ],
  });
}

const PLAN_BUILDERS: Record<PlanId, () => PlanDefinition> = {
  free: freePlan,
  starter: starterPlan,
  creator: creatorPlan,
  pro: proPlan,
  scale: scalePlan,
  business: businessPlan,
  enterprise: enterprisePlan,
};

/** Snapshot of plans (recomputed so env overrides apply in tests). */
export const PLANS: Record<PlanId, PlanDefinition> = {
  get free() {
    return freePlan();
  },
  get starter() {
    return starterPlan();
  },
  get creator() {
    return creatorPlan();
  },
  get pro() {
    return proPlan();
  },
  get scale() {
    return scalePlan();
  },
  get business() {
    return businessPlan();
  },
  get enterprise() {
    return enterprisePlan();
  },
};

export function planCatalog(): PlanDefinition[] {
  return (Object.keys(PLAN_BUILDERS) as PlanId[]).map((id) => PLAN_BUILDERS[id]());
}

export function planFromId(id: string): PlanDefinition {
  if (id in PLAN_BUILDERS) return PLAN_BUILDERS[id as PlanId]();
  return freePlan();
}

export function planPriority(id: string): number {
  return planFromId(id).priority;
}

/** True when org plan meets or exceeds the required tier. */
export function planMeets(current: string, required: PlanId): boolean {
  return planPriority(current) >= planPriority(required);
}

/** Paid self-serve / enterprise — commercial features (Starter+). */
export function isPaidPlan(id: string): boolean {
  return planMeets(id, 'starter');
}

export function stripePriceIdForPlan(plan: PlanId): string | undefined {
  const def = planFromId(plan);
  if (!def.stripePriceEnv) return undefined;
  const value = process.env[def.stripePriceEnv]?.trim();
  return value || undefined;
}

export function planIdFromStripePrice(priceId: string | undefined | null): PlanId | null {
  if (!priceId) return null;
  for (const plan of planCatalog()) {
    if (!plan.stripePriceEnv) continue;
    if (process.env[plan.stripePriceEnv] === priceId) return plan.id;
  }
  // Legacy: only PRO price configured → treat as pro
  if (process.env.STRIPE_PRICE_ID_PRO && priceId === process.env.STRIPE_PRICE_ID_PRO) return 'pro';
  return null;
}

export function rateLimitWindowSec(): number {
  const raw = Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 60;
}
