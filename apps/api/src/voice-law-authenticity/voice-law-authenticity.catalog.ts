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
  return {
    id: 'voice-law-authenticity',
    title: 'Voice Law Authenticity',
    blurb:
      'Law-facing model surface that screens recordings for synthetic / spoof risk, optional speaker match, and civic seal provenance — then packages an assistive authenticity report for investigators and legal teams.',
    honesty: voiceLawAuthenticityHonesty(),
    docs: '/docs/VOICE_LAW_AUTHENTICITY.md',
    related: {
      antiSpoof: '/voice-biometrics',
      evidence: '/civic-voice-evidence',
      seal: '/civic-voice-seal',
      truthGuard: '/civic-truth-guard',
      justice: '/justice-language-access',
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
      trainingNote:
        'v1 uses VerbaLab heuristic anti-spoof proxies + optional speaker verify + civic seal check. Upgrade path: ASVspoof-trained PAD model behind the same API.',
    },
  };
}
