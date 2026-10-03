export type CloningCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type CloningCapability = {
  id: string;
  name: string;
  status: CloningCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 29 → Enterprise Voice Cloning Platform (VL-172). */
export function voiceCloningEngineCatalog() {
  return {
    product: 'VerbaLab Voice Cloning',
    note:
      'Enterprise cloning over ElevenLabs Instant Voice Cloning with mandatory consent, ownership, abuse review, and watermark (ADR-0042/0083). Professional mode = stricter enrollment on the same vendor path — not a separate trained pro model. NIST voice biometrics deferred to Phase 33.',
    capabilities: [
      {
        id: 'instant-cloning',
        name: 'Instant Voice Cloning',
        status: 'shipped',
        api: 'POST /v1/voice-cloning/enroll',
        notes: '1+ samples, consent attestation, pending_review → approve. Legacy: POST /v1/voice-clones.',
      },
      {
        id: 'professional-cloning',
        name: 'Professional Voice Cloning',
        status: 'shipped',
        api: 'POST /v1/voice-cloning/enroll',
        notes:
          'Shipped cloneMode=professional (≥3 samples + ownership attestation) on ElevenLabs IVC. Multi-hour pro training path deferred.',
      },
      {
        id: 'secure-enrollment',
        name: 'Secure Voice Enrollment',
        status: 'shipped',
        api: 'POST /v1/voice-cloning/clones/:id/verify-enrollment',
        notes: 'Sample-count + consent gate; samples stored under org-scoped keys.',
      },
      {
        id: 'voice-verification',
        name: 'Voice Verification',
        status: 'shipped',
        api: 'POST /v1/speakers/verify',
        notes:
          'Shipped speaker verify/identify via VL-152 + enrollment sample/consent gate. PAD/NIST biometrics deferred to VL-176 honesty.',
      },
      {
        id: 'voice-ownership',
        name: 'Voice Ownership',
        status: 'shipped',
        api: 'PATCH /v1/voice-cloning/clones/:id/ownership',
        notes: 'Explicit ownership attestation separate from speaker consent; audited.',
      },
      {
        id: 'voice-licensing',
        name: 'Voice Licensing',
        status: 'shipped',
        api: 'PATCH /v1/voice-cloning/clones/:id/license',
        notes: 'internal | commercial | restricted license tags + notes. Marketplace SKUs = Phase 34.',
      },
      {
        id: 'voice-permissions',
        name: 'Voice Permissions',
        status: 'shipped',
        api: 'PATCH /v1/voice-cloning/clones/:id/permissions',
        notes: 'canSynthesize / canShare / canExport + allowedRoles.',
      },
      {
        id: 'enterprise-library',
        name: 'Enterprise Voice Library',
        status: 'shipped',
        api: 'GET /v1/voice-cloning/library',
        notes: 'Workspace library of clones with consent/ownership/license metadata.',
      },
      {
        id: 'consent-management',
        name: 'Consent Management',
        status: 'shipped',
        api: 'GET /v1/voice-cloning/consent/policy',
        notes: 'Required consent fields, audit actions, watermark policy. Not buried ToS-only.',
      },
      {
        id: 'realtime',
        name: 'Realtime APIs',
        status: 'shipped',
        api: 'POST /v1/voice-cloning/enroll/stream',
        notes:
          'Shipped SSE enrollment progress events after create. Live sample capture WebSocket deferred.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'shared observability',
        notes: 'Audit voice_clone.* events; watermark header on clone speech.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/voice-cloning/engine/analytics',
        notes: 'Shipped clone counts by status/mode. Full Voice Analytics hub: VL-178.',
      },
    ] satisfies CloningCapability[],
    engines: [
      {
        id: 'elevenlabs_ivc',
        name: 'ElevenLabs Instant Voice Cloning',
        role: 'primary',
        modes: ['instant', 'professional_enrollment'],
      },
    ],
    trust: {
      consentRequired: true,
      ownershipAttestation: true,
      abuseReview: true,
      watermarkRequired: true,
      auditActions: [
        'voice_clone.created',
        'voice_clone.ownership_updated',
        'voice_clone.license_updated',
        'voice_clone.permissions_updated',
        'voice_clone.enrollment_verified',
        'voice_clone.reviewed',
        'voice_clone.disabled',
      ],
    },
    links: {
      console: '/voice-cloning',
      hub: '/voice-cloud',
      studio: '/audio',
      legacy: '/v1/voice-clones',
      openapi: '/v1/openapi.json',
      docs: '/docs/VOICE_CLONING.md',
    },
    architecture: {
      rest: true,
      graphql: true,
      sdk: '@verbalab/sdk',
      cli: '@verbalab/cli',
      docker: true,
      terraform: true,
      kubernetes: true,
      primaryRegion: 'af-south-1',
      deployment: 'Fly default; optional EKS af-south-1 (shared platform)',
    },
  };
}

export function voiceCloningConsentPolicy() {
  return {
    product: 'VerbaLab Voice Cloning',
    required: {
      consentAttested: true,
      consentNotesMinChars: 8,
      humanAbuseReview: true,
      watermarkOnSpeech: true,
    },
    professionalMode: {
      minSamples: 3,
      ownershipAttested: true,
      ownershipNotesMinChars: 8,
    },
    instantMode: {
      minSamples: 1,
      ownershipAttested: false,
    },
    forbidden: [
      'Cloning without explicit speaker consent attestation',
      'Skipping abuse review (pending_review → approved)',
      'Disabling watermark on clone speech',
      'Treating ToS checkbox alone as consent',
    ],
    audit: voiceCloningEngineCatalog().trust.auditActions,
    docs: '/docs/VOICE_CLONING.md',
  };
}
