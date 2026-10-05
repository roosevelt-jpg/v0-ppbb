import { getOwnModelFamily, ownModelFamilies, type OwnModelFamily } from './own-models.catalog';

export type RouteIntent =
  | 'chat'
  | 'reason'
  | 'stt'
  | 'stt_realtime'
  | 'tts'
  | 'mt'
  | 'ocr'
  | 'embed'
  | 'dub'
  | 'offline'
  | 'multimodal'
  | 'discover';

export type BudgetPref = 'frugal' | 'balanced' | 'quality';

const INTENT_DEFAULTS: Record<RouteIntent, string> = {
  chat: 'baobab',
  reason: 'reason-fm',
  stt: 'echo',
  stt_realtime: 'speech-depth',
  tts: 'voice-fm',
  mt: 'translate-fm',
  ocr: 'vision-fm',
  embed: 'vector-fm',
  dub: 'video-voice',
  offline: 'edge',
  multimodal: 'fusion',
  discover: 'ai-internet',
};

/**
 * Pick the sharpest cost-effective Own Model for an intent.
 * Budget frugal → prefer cheaper siblings; quality → allow premium.
 */
export function routeOwnModel(input: {
  intent: RouteIntent | string;
  budget?: BudgetPref;
  language?: string;
  preferOffline?: boolean;
}): {
  primary: OwnModelFamily;
  alternates: OwnModelFamily[];
  reason: string;
  estimatedProduct: string | null;
} {
  const intent = (input.intent || 'chat') as RouteIntent;
  const budget = input.budget ?? 'balanced';

  if (input.preferOffline) {
    const edge = getOwnModelFamily('edge')!;
    return {
      primary: edge,
      alternates: [getOwnModelFamily('echo')!, getOwnModelFamily('voice-fm')!].filter(Boolean),
      reason: 'Offline / residency requested — Edge packs minimize cloud burn.',
      estimatedProduct: null,
    };
  }

  let primaryId = INTENT_DEFAULTS[intent] ?? 'baobab';

  if (budget === 'frugal') {
    if (intent === 'reason') primaryId = 'baobab';
    if (intent === 'stt_realtime') primaryId = 'echo';
    if (intent === 'dub') primaryId = 'voice-fm';
    if (intent === 'multimodal') primaryId = 'baobab';
  }
  if (budget === 'quality') {
    if (intent === 'chat') primaryId = 'reason-fm';
    if (intent === 'stt') primaryId = 'speech-depth';
  }

  const primary = getOwnModelFamily(primaryId) ?? getOwnModelFamily('baobab')!;
  const alternates = primary.siblings
    .map((s) => getOwnModelFamily(s.id))
    .filter((f): f is OwnModelFamily => Boolean(f));

  const langNote = input.language
    ? ` Language hint=${input.language} (hero coverage preferred).`
    : '';

  return {
    primary,
    alternates,
    reason: `Intent=${intent}, budget=${budget} → ${primary.title} (${primary.costTier}).${langNote}`,
    estimatedProduct: primary.creditProduct ?? null,
  };
}

export function listRoutingTable() {
  return Object.entries(INTENT_DEFAULTS).map(([intent, familyId]) => ({
    intent,
    defaultFamily: familyId,
    family: getOwnModelFamily(familyId)?.title,
    costTier: getOwnModelFamily(familyId)?.costTier,
  }));
}

export function compareFamilies(ids: string[]) {
  const rows = ids
    .map((id) => getOwnModelFamily(id))
    .filter((f): f is OwnModelFamily => Boolean(f));
  return {
    count: rows.length,
    families: rows.map((f) => ({
      id: f.id,
      title: f.title,
      modality: f.modality,
      costTier: f.costTier,
      sharpness: f.sharpness,
      creditProduct: f.creditProduct ?? null,
      marketingLine: f.marketingLine,
    })),
    all: ownModelFamilies().map((f) => f.id),
  };
}
