import { padProviderStatus } from '../model-release/pad-provider';

export function voiceLawAuthenticityHonesty() {
  return {
    product: 'voice-law-authenticity',
    shipped: true,
    courtSoleEvidence: false,
    nistPadCertified: false,
    asvspoofCertified: false,
    note:
      'Assistive forensic screening for synthetic / impersonated voice. Not a courtroom verdict, not NIST PAD / ASVspoof certified. Always combine with human expert review, chain-of-custody, and jurisdiction rules.',
  };
}

export function voiceLawAuthenticityCatalog() {
  const pad = padProviderStatus();
  return {
    id: 'voice-law-authenticity',
    title: 'Voice Law Authenticity',
    blurb:
      'Law-facing model surface that screens recordings for synthetic / spoof risk, optional speaker match, and civic seal provenance — then packages an assistive authenticity report for investigators and legal teams.',
    honesty: voiceLawAuthenticityHonesty(),
    docs: '/docs/VOICE_LAW_AUTHENTICITY.md',
    pad,
    related: {
      antiSpoof: '/voice-biometrics',
      evidence: '/civic-voice-evidence',
      seal: '/civic-voice-seal',
      truthGuard: '/civic-truth-guard',
      justice: '/justice-language-access',
      modelRelease: '/model-release',
    },
    capabilities: [
      {
        id: 'analyze',
        name: 'Analyze recording (fake vs real risk)',
        status: 'shipped' as const,
        api: 'POST /v1/voice-law-authenticity/analyze',
      },
      {
        id: 'report',
        name: 'Fetch authenticity report',
        status: 'shipped' as const,
        api: 'GET /v1/voice-law-authenticity/reports/{id}',
      },
      {
        id: 'list',
        name: 'List recent reports',
        status: 'shipped' as const,
        api: 'GET /v1/voice-law-authenticity/reports',
      },
      {
        id: 'expert-review',
        name: 'Request accredited lab expert review',
        status: 'shipped' as const,
        api: 'POST /v1/voice-law-authenticity/reports/{id}/expert-review',
      },
      {
        id: 'engine',
        name: 'Engine catalog',
        status: 'shipped' as const,
        api: 'GET /v1/voice-law-authenticity/engine',
      },
    ],
    modelCard: {
      id: 'vl-law-voice-auth-v1',
      family: 'voice-authenticity',
      task: 'synthetic_speech_and_replay_risk_screening',
      input: 'audio/wav|mp3|ogg|webm',
      output: 'riskScore + decision + signals + legalDisclaimer',
      padProvider: pad.active,
      trainingNote:
        'Default PAD = heuristic anti-spoof. Set VERBALAB_PAD_URL to plug an ASVspoof-/ADD-trained African+telephony PAD without changing this API. Expert review workflow partners with accredited labs — model never sole evidence.',
    },
    upgradePath: [
      'Keep the same analyze API; swap heuristics for GPU PAD via VERBALAB_PAD_URL',
      'Train on African languages / telephony codecs (the courtroom gap)',
      'Use expert-review endpoints to hand off to accredited forensic labs',
      'Infra: Tier A GPU for PAD inference; Tier B for VerbaLab PAD checkpoint training',
    ],
  };
}
