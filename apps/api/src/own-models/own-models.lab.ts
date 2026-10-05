import { getOwnModelFamily, type OwnModelFamily } from './own-models.catalog';
import { routeOwnModel, type BudgetPref, type RouteIntent } from './own-models.router';

export type LabRecipe = {
  id: string;
  title: string;
  blurb: string;
  intent: RouteIntent;
  /** Suggested pipeline order (left → right) */
  pipeline: string[];
  sampleInput: {
    text: string;
    source?: string;
    target?: string;
  };
  successLooksLike: string;
};

export function labRecipes(): LabRecipe[] {
  return [
    {
      id: 'african-chat',
      title: 'African language assistant',
      blurb: 'Customer support or FAQ bot that answers in Swahili, Yoruba, etc.',
      intent: 'chat',
      pipeline: ['baobab', 'voice-fm'],
      sampleInput: {
        text: 'Habari, naweza kupata bei ya usafiri kutoka Nairobi hadi Mombasa?',
        source: 'sw',
        target: 'sw',
      },
      successLooksLike: 'Clear reply in the user’s language — not English-only.',
    },
    {
      id: 'translate-content',
      title: 'Translate marketing / docs',
      blurb: 'en↔African language localization with glossary-friendly MT.',
      intent: 'mt',
      pipeline: ['translate-fm'],
      sampleInput: {
        text: 'Good morning. We ship samples from Lagos to Ibadan this week.',
        source: 'en',
        target: 'sw',
      },
      successLooksLike: 'Fluent Af–En meaning, not word salad.',
    },
    {
      id: 'voiceover',
      title: 'Voiceover / IVR speak',
      blurb: 'Turn a script into natural African speech.',
      intent: 'tts',
      pipeline: ['voice-fm'],
      sampleInput: {
        text: 'Karibu VerbaLab. Asante kwa kupiga simu.',
        target: 'sw',
      },
      successLooksLike: 'Audio you can play — clear, not robotic English-only.',
    },
    {
      id: 'meeting-notes',
      title: 'Meeting / call transcription',
      blurb: 'Speech → text for African accents, then optional summary.',
      intent: 'stt',
      pipeline: ['echo', 'baobab'],
      sampleInput: {
        text: '(Upload audio, or use fixture STT) Leo tulizungumza kuhusu ratiba ya wiki.',
        source: 'sw',
      },
      successLooksLike: 'Readable transcript; dialect tags if streaming.',
    },
    {
      id: 'dubbing',
      title: 'Video / content dubbing',
      blurb: 'Script or source audio → translate → speak (pipeline).',
      intent: 'dub',
      pipeline: ['translate-fm', 'voice-fm'],
      sampleInput: {
        text: 'Welcome to Nairobi. Thank you for shopping local.',
        source: 'en',
        target: 'sw',
      },
      successLooksLike: 'Target-language audio + low credits vs Reason FM.',
    },
    {
      id: 'docs-ocr',
      title: 'Scan a document',
      blurb: 'OCR a form / ID page, optionally translate the text.',
      intent: 'ocr',
      pipeline: ['vision-fm', 'translate-fm'],
      sampleInput: {
        text: 'Sample OCR: National ID · Name: Amina Okafor · Lagos',
        source: 'en',
        target: 'yo',
      },
      successLooksLike: 'Extracted text you can copy; MT optional.',
    },
    {
      id: 'rag-search',
      title: 'Search your knowledge',
      blurb: 'Embed docs cheaply, answer with Baobab.',
      intent: 'embed',
      pipeline: ['vector-fm', 'baobab'],
      sampleInput: {
        text: 'What is VerbaLab Voice Law Authenticity used for?',
      },
      successLooksLike: 'Embedding dims + a grounded chat answer.',
    },
    {
      id: 'hard-reasoning',
      title: 'Hard analysis (escalate)',
      blurb: 'Multi-step policy / compliance reasoning — only when Baobab is not enough.',
      intent: 'reason',
      pipeline: ['baobab', 'reason-fm'],
      sampleInput: {
        text: 'Compare three options for Africa-hosted STT with cost ceilings and residency. Recommend one.',
      },
      successLooksLike: 'Structured recommendation; Reason only if Baobab is thin.',
    },
  ];
}

export function inferIntentFromGoal(goal: string): RouteIntent {
  const g = goal.toLowerCase();
  if (/\b(offline|edge|no.?internet|clinic|border)\b/.test(g)) return 'offline';
  if (/\b(dub|dubbing|video voice|voice.?over for video)\b/.test(g)) return 'dub';
  if (/\b(transcri|stt|speech.?to.?text|meeting|call notes?)\b/.test(g)) return 'stt';
  if (/\b(tts|speak|voiceover|ivr|read aloud|text.?to.?speech)\b/.test(g)) return 'tts';
  if (/\b(ocr|scan|document|pdf|id card|form)\b/.test(g)) return 'ocr';
  if (/\b(embed|rag|search|vector|similarity|retrieve)\b/.test(g)) return 'embed';
  if (/\b(translat|localiz|swahili|yoruba|hausa|amharic|zulu|afrikaans)\b/.test(g)) return 'mt';
  if (/\b(reason|analy[sz]e|compliance|multi.?step|compare options)\b/.test(g)) return 'reason';
  if (/\b(multimodal|image.?and.?audio|fusion)\b/.test(g)) return 'multimodal';
  return 'chat';
}

export function recommendForGoal(input: {
  goal?: string;
  recipeId?: string;
  budget?: BudgetPref;
  language?: string;
}) {
  const recipe = input.recipeId
    ? labRecipes().find((r) => r.id === input.recipeId)
    : undefined;
  const intent = recipe?.intent ?? inferIntentFromGoal(input.goal ?? '');
  const budget = input.budget ?? 'balanced';
  const routed = routeOwnModel({
    intent,
    budget,
    language: input.language,
  });

  const pipelineIds = recipe?.pipeline ?? [
    routed.primary.id,
    ...routed.alternates.slice(0, 1).map((a) => a.id),
  ];
  const pipeline = pipelineIds
    .map((id) => getOwnModelFamily(id))
    .filter((f): f is OwnModelFamily => Boolean(f));

  const compareWith =
    budget === 'quality' && routed.primary.id === 'baobab'
      ? getOwnModelFamily('reason-fm')
      : routed.alternates[0] ??
        (routed.primary.id === 'echo' ? getOwnModelFamily('speech-depth') : getOwnModelFamily('baobab'));

  return {
    intent,
    budget,
    recipe: recipe
      ? { id: recipe.id, title: recipe.title, successLooksLike: recipe.successLooksLike }
      : null,
    primary: summarize(routed.primary),
    compareWith: compareWith ? summarize(compareWith) : null,
    pipeline: pipeline.map(summarize),
    reason: routed.reason,
    howToTest:
      'Run Live try on the primary, then Compare with the alternate on the same sample. Pick the clearer output at the lower cost tier.',
    sampleInput: recipe?.sampleInput ?? {
      text: input.goal?.trim() || 'Karibu. How should we help in Swahili?',
      source: 'en',
      target: 'sw',
    },
  };
}

function summarize(f: OwnModelFamily) {
  return {
    id: f.id,
    title: f.title,
    modality: f.modality,
    costTier: f.costTier,
    marketingLine: f.marketingLine,
    consolePath: f.consolePath,
    try: f.try,
  };
}
