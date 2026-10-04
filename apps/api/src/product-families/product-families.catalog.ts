export type FamilyId = 'VerbaCreative' | 'VerbaAgents' | 'VerbaAPI' | 'Resources';
export type ReadinessStatus = 'shipped_e2e' | 'partial' | 'marketing_only' | 'broken';

export type ProductReadiness = {
  slug: string;
  family: FamilyId;
  name: string;
  status: ReadinessStatus;
  api: string | null;
  consoleHref: string;
  metered: boolean;
  planGate: string | null;
  honesty: string;
  unlocksWithPlan: string;
};

/** Canonical readiness for VerbaCreative / VerbaAgents / VerbaAPI / Resources surfaces. */
export function productFamiliesCatalog(): {
  product: string;
  note: string;
  families: FamilyId[];
  products: ProductReadiness[];
} {
  return {
    product: 'VerbaLab product families',
    note:
      'Honest readiness for VerbaCreative, VerbaAgents, VerbaAPI, and Resources. Paid plans unlock shared monthly credits + commercial/PVC gates — capabilities match what is shipped_e2e or clearly disclosed as partial.',
    families: ['VerbaCreative', 'VerbaAgents', 'VerbaAPI', 'Resources'],
    products: [
      // VerbaCreative
      row('text-to-speech', 'VerbaCreative', 'Text to Speech', 'shipped_e2e', 'POST /v1/audio/speech', '/voice-studio', true, null, 'Neural TTS + Voice Studio; shared TTS character credits.', 'Free+ credits; commercial export Starter+'),
      row('speech-to-text', 'VerbaCreative', 'Speech to Text', 'shipped_e2e', 'POST /v1/speech/recognize', '/speech-recognition', true, null, 'Accent-aware STT; shared STT minute credits.', 'Free+ credits'),
      row('meeting-transcription', 'VerbaCreative', 'Meeting Transcription', 'partial', 'POST /v1/meeting-transcription/transcribe', '/meeting-transcription', true, null, 'File STT + optional TTS recap — not Zoom-class meeting bots.', 'Free+ credits via STT/TTS'),
      row('voice-changer', 'VerbaCreative', 'Voice Changer', 'shipped_e2e', 'POST /v1/creative-media/voice-changer', '/creative-media', true, null, 'On-platform pitch/tempo transform (not neural VC weights).', 'Free+ credits'),
      row('text-to-sound-effects', 'VerbaCreative', 'Text to Sound Effects', 'shipped_e2e', 'POST /v1/creative-media/sound-effects', '/creative-media', true, 'commercial', 'Procedural SFX beds; commercial license for paid publish.', 'Free+ credits; commercial Starter+'),
      row('voice-cloning', 'VerbaCreative', 'Voice Cloning', 'shipped_e2e', 'POST /v1/voice-clones', '/voice-cloning', false, 'starter|creator', 'Instant IVC Starter+; Professional Voice Cloning Creator+.', 'Starter+ IVC; Creator+ PVC'),
      row('voice-isolator', 'VerbaCreative', 'Voice Isolator', 'shipped_e2e', 'POST /v1/creative-media/isolate', '/creative-media', true, null, 'DSP speech isolation path (not a separate ML isolator model).', 'Free+ credits'),
      row('ai-music-generator', 'VerbaCreative', 'AI Music Generator', 'shipped_e2e', 'POST /v1/creative-media/music', '/creative-media', true, 'commercial', 'Procedural music beds for ads/podcasts.', 'Free+ credits; commercial Starter+'),
      row('studio', 'VerbaCreative', 'Studio', 'shipped_e2e', 'POST /v1/voice-studio/timeline/render', '/voice-studio', true, null, 'Voice Studio timeline + SSML/lexicon.', 'Free Studio basics; paid credit pools'),
      row('voice-design', 'VerbaCreative', 'Voice Design', 'partial', 'POST /v1/creative-media/voice-design', '/creative-media', false, null, 'Returns a design profile for TTS routing — not a trained embedding.', 'Free+'),
      row('ai-voice-generator', 'VerbaCreative', 'AI Voice Generator', 'shipped_e2e', 'POST /v1/tts/synthesize', '/neural-tts', true, null, 'Neural TTS console + API.', 'Free+ credits'),
      row('ai-image-generator', 'VerbaCreative', 'AI Image Generator', 'partial', 'POST /v1/creative-media/image', '/creative-media', true, null, 'Campaign SVG stills — not diffusion image models.', 'Free+ credits'),
      row('ai-video-generator', 'VerbaCreative', 'AI Video Generator', 'partial', 'POST /v1/creative-media/video', '/creative-media', true, null, 'Storyboard package + partner video paths — not full rendered MP4.', 'Free+ credits'),
      row('ads-engine', 'VerbaCreative', 'Ads Engine', 'shipped_e2e', 'POST /v1/creative-media/ads', '/creative-media', true, 'commercial', 'Packages SFX + music + still + TTS recipe; dub via video-voice.', 'Free+ credits; commercial Starter+'),
      row('dubbing', 'VerbaCreative', 'Dubbing', 'shipped_e2e', 'POST /v1/video-voice/dub', '/video-voice', true, 'commercial', 'STT→translate→TTS dubbed audio track; watermark free, clean export Starter+.', 'Free watermarked; clean/commercial Starter+'),

      // VerbaAgents
      row('voice-agents', 'VerbaAgents', 'Voice Agents', 'shipped_e2e', 'POST /v1/voice/simulate', '/voice', true, null, 'FAQ voice agent + Twilio path; STT/TTS in loop.', 'Free+ credits'),
      row('voice-bridges', 'VerbaAgents', 'Voice Platform Bridges', 'shipped_e2e', 'GET /v1/voice-bridges/engine', '/voice-bridges', true, null, 'VAPI/Twilio/Amazon/Google/SIP/WebRTC bridges — Own AI TTS/STT/agents behind partner-shaped APIs.', 'Free+ credits on TTS/STT'),
      row('sovereign-voice-os', 'VerbaAgents', 'Sovereign Voice OS', 'shipped_e2e', 'GET /v1/sovereign-voice-os/engine', '/sovereign-voice-os', false, null, 'Umbrella control plane for national runtime, evidence, corridors, institutional voice, offline mesh.', 'Free+'),
      row('national-voice-runtime', 'VerbaAgents', 'National Voice Runtime', 'shipped_e2e', 'POST /v1/national-voice-runtime/zones', '/national-voice-runtime', false, null, 'Per-country sealed zones + kill-switch + audit export (control plane; island deploy still required).', 'Free+'),
      row('civic-voice-evidence', 'VerbaAgents', 'Civic Voice Evidence', 'shipped_e2e', 'POST /v1/civic-voice-evidence/append', '/civic-voice-evidence', false, null, 'Append-only utterance hash chain with court export — process-local durability unless externalized.', 'Free+'),
      row('mutual-intelligibility', 'VerbaAgents', 'Mutual Intelligibility', 'shipped_e2e', 'POST /v1/mutual-intelligibility/bridge', '/mutual-intelligibility', false, null, 'ECOWAS/EAC/SADC corridor bridges without mandatory English pivot.', 'Free+'),
      row('institutional-voice', 'VerbaAgents', 'Institutional Voice', 'shipped_e2e', 'POST /v1/institutional-voice/speak', '/institutional-voice', false, null, 'Policy-corpus constrained agency answers with refusal when off-policy.', 'Free+'),
      row('offline-mesh-voice', 'VerbaAgents', 'Offline Mesh Voice', 'shipped_e2e', 'POST /v1/offline-mesh-voice/sync', '/offline-mesh-voice', false, null, 'Mesh node registry + store-and-forward sync; pairs with Edge Offline packs for binaries.', 'Free+'),
      row('agent-voice-training', 'VerbaAgents', 'Agent Voice Training', 'shipped_e2e', 'POST /v1/agent-voice-training/personas/:id/preview', '/agent-voice-training', true, null, 'Persona packs + multilingual speak preview (TTS audio).', 'Free+ TTS credits on preview'),
      row('conversational-ai', 'VerbaAgents', 'Conversational AI', 'shipped_e2e', 'POST /v1/chat/completions', '/chat', true, null, 'African Voice LLM chat with optional speak-back.', 'Free+ chat/TTS credits'),
      row('integrations', 'VerbaAgents', 'Integrations', 'shipped_e2e', 'POST /v1/connectors/install', '/connectors', false, null, 'Connector catalog + voice-bridges + partner invoke/MCP.', 'Free+'),
      row('telecommunications', 'VerbaAgents', 'Telecommunications', 'shipped_e2e', 'POST /v1/voice/twilio/inbound', '/voice-bridges', true, null, 'Twilio TwiML + SIP trunk recipe + call intelligence.', 'Free+ credits'),
      row('financial-services', 'VerbaAgents', 'Financial Services', 'partial', 'GET /v1/financial-intelligence/engine', '/financial-intelligence', false, null, 'Vertical vocab/playbooks — not a full KYC OS.', 'Free+'),
      row('healthcare', 'VerbaAgents', 'Healthcare', 'partial', 'GET /v1/healthcare-intelligence/engine', '/healthcare-intelligence', false, null, 'Vertical vocab/playbooks — not clinical OS.', 'Free+'),
      row('government', 'VerbaAgents', 'Government', 'partial', 'GET /v1/government-intelligence/engine', '/government-intelligence', false, null, 'Vertical vocab/playbooks — not citizen-service OS.', 'Free+'),
      row('technology', 'VerbaAgents', 'Technology', 'shipped_e2e', 'POST /v1/partner-connectors/invoke', '/partner-connectors', false, null, 'Partner invoke/MCP wired.', 'Free+'),
      row('retail-ecommerce', 'VerbaAgents', 'Retail & E-commerce', 'partial', null, '/use-cases/trade', false, null, 'Use-case lander + shared agent/speech stack.', 'Free+ via agents/speech'),
      row('travel-hospitality', 'VerbaAgents', 'Travel & Hospitality', 'partial', 'GET /v1/tourism-heritage-intelligence/engine', '/tourism-heritage-intelligence', false, null, 'Tourism vocab — not concierge OS.', 'Free+'),
      row('customer-support', 'VerbaAgents', 'Customer Support', 'partial', null, '/use-cases/customer-experience', false, null, 'Use-case lander + chat/voice agents.', 'Free+ via chat/voice'),
      row('chatbots', 'VerbaAgents', 'Chatbots', 'partial', 'POST /v1/agent-operating-system/run', '/agent-intelligence', false, null, 'Agent intelligence hub — not a full visual chatbot builder.', 'Free+'),
      row('education', 'VerbaAgents', 'Education', 'partial', 'GET /v1/education-intelligence/engine', '/education-intelligence', false, null, 'Vertical vocab — not tutoring OS.', 'Free+'),
      row('verba-voice', 'VerbaAgents', 'VerbaVoice', 'shipped_e2e', 'POST /v1/verba-voice/sessions', '/verba-voice', true, null, 'Realtime voice sessions (signaling + barge-in).', 'Free+ credits'),
      row('voice-passport', 'VerbaAgents', 'Voice Passport', 'shipped_e2e', 'POST /v1/voice-passport', '/voice-passport', false, null, 'Workspace voice passport records (in-memory durability limits).', 'Free+'),

      // VerbaAPI (footer + key surfaces)
      row('api-reference', 'VerbaAPI', 'API Reference', 'shipped_e2e', 'GET /v1/openapi.json', '/docs/openapi', false, null, 'Interactive OpenAPI explorer for documented surfaces.', 'Free+ with API keys'),
      row('agents-api', 'VerbaAPI', 'Agents API', 'partial', 'POST /v1/agent-runtime/run', '/agent-intelligence', false, null, 'Sandbox/simulated agent steps — not open tool execution.', 'Free+ API keys'),
      row('speech-engine', 'VerbaAPI', 'Speech Engine', 'shipped_e2e', 'POST /v1/speech/recognize', '/speech', true, null, 'STT engine APIs with credit assert.', 'Free+ credits'),
      row('dubbing-api', 'VerbaAPI', 'Dubbing API', 'shipped_e2e', 'POST /v1/video-voice/dub', '/video-voice', true, 'commercial', 'API-key dubbing jobs with mode-based credit rates.', 'Free watermarked; clean Starter+'),
      row('text-to-speech-api', 'VerbaAPI', 'Text to Speech API', 'shipped_e2e', 'POST /v1/audio/speech', '/voice-studio', true, null, 'Metered HTTP TTS + Studio prototyping.', 'Free+ credits'),
      row('speech-to-text-api', 'VerbaAPI', 'Speech to Text API', 'shipped_e2e', 'POST /v1/audio/transcriptions', '/speech-recognition', true, null, 'Metered HTTP STT.', 'Free+ credits'),
      row('sound-effects-api', 'VerbaAPI', 'Sound Effects API', 'shipped_e2e', 'POST /v1/creative-media/sound-effects', '/creative-media', true, 'commercial', 'Procedural SFX API + OpenAPI path.', 'Free+ credits'),
      row('music-api', 'VerbaAPI', 'Music API', 'shipped_e2e', 'POST /v1/creative-media/music', '/creative-media', true, 'commercial', 'Procedural music API + OpenAPI path.', 'Free+ credits'),
      row('translate-api', 'VerbaAPI', 'Translate API', 'shipped_e2e', 'POST /v1/translate', '/playground', true, null, 'Full translate + quota assert + SDK.', 'Free+ credits'),
      row('ios-sdk', 'VerbaAPI', 'iOS SDK', 'partial', null, '/docs', false, null, 'Monorepo SPM package — not a published remote CocoaPod.', 'N/A'),
      row('android-sdk', 'VerbaAPI', 'Android SDK', 'partial', null, '/docs', false, null, 'Local Gradle/mavenLocal — Maven Central aspirational.', 'N/A'),
      row('api-key', 'VerbaAPI', 'API Keys', 'shipped_e2e', 'POST /v1/api-keys', '/keys', false, null, 'Create/manage vl_live_/vl_test_ keys.', 'Free+'),

      // Resources
      row('playground', 'Resources', 'Playground', 'shipped_e2e', 'POST /v1/translate|detect|/v1/audio/speech', '/playground', true, null, 'Public translate/detect/TTS playground with API keys.', 'Free+ credits on metered calls'),
      row('marketplace', 'Resources', 'Marketplace', 'shipped_e2e', 'GET /v1/marketplace/listings', '/marketplace', false, 'starter', 'Free catalog browse + free installs; publish/paid commerce Starter+; links to voice/agent/model markets.', 'Free browse; Starter+ publish/paid'),
      row('enterprise', 'Resources', 'Enterprise', 'shipped_e2e', 'GET /v1/enterprise/overview', '/enterprise', false, null, 'Residency, governance, billing, and admin deep-links.', 'Free+ (enterprise features by plan)'),
      row('trust-center', 'Resources', 'Trust Center', 'shipped_e2e', 'GET /v1/trust-cloud/overview', '/trust-cloud', false, null, 'Trust Cloud hub + compliance/enterprise links; not a certified SOC portal.', 'Free+'),
      row('coverage', 'Resources', 'Coverage', 'shipped_e2e', 'GET /v1/coverage', '/coverage', false, null, 'Language inventory + African country packs + golden-eval focus pairs.', 'Public'),
      row('developers', 'Resources', 'Developers', 'shipped_e2e', 'GET /v1/developer/overview', '/developers', false, null, 'Keys, SDK install strings, docs, playground, OpenAPI.', 'Free+'),
      row('docs', 'Resources', 'Docs', 'shipped_e2e', 'GET /v1/openapi.json', '/docs', false, null, 'Docs home + curated endpoints + OpenAPI jump.', 'Public'),
      row('openapi-explorer', 'Resources', 'OpenAPI explorer', 'shipped_e2e', 'GET /v1/openapi.json', '/docs/openapi', false, null, 'Browse schemas and try selected endpoints with API keys.', 'Free+ for authenticated tries'),
    ],
  };
}

function row(
  slug: string,
  family: FamilyId,
  name: string,
  status: ReadinessStatus,
  api: string | null,
  consoleHref: string,
  metered: boolean,
  planGate: string | null,
  honesty: string,
  unlocksWithPlan: string,
): ProductReadiness {
  return { slug, family, name, status, api, consoleHref, metered, planGate, honesty, unlocksWithPlan };
}

export function productFamiliesHonesty() {
  return {
    billingModel: 'verbalab-shared-credits',
    commercialFrom: 'starter',
    professionalVoiceCloningFrom: 'creator',
    imageVideoHonesty: 'Creative image/video endpoints ship SVG stills and storyboards — disclosed as partial.',
    dubbingHonesty: 'Dubbing returns localized audio; picture mux is partner/out-of-band.',
  };
}
