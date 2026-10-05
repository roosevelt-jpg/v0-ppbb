/**
 * VerbaLab Global AI Standard — ISO-aligned process maturity model.
 *
 * This describes how VerbaLab runs its own standards and certification program
 * with rigor comparable to ISO/IEC process practice. It does not assert that
 * VerbaLab standards are ISO-adopted or that certificates are accredited.
 */

export type VgasDocumentStage =
  | 'proposal'
  | 'working_draft'
  | 'committee_draft'
  | 'enquiry_draft'
  | 'final_draft'
  | 'published'
  | 'withdrawn';

export function vgasDocumentStages(): Array<{
  id: VgasDocumentStage;
  label: string;
  isoAnalogy: string;
  description: string;
}> {
  return [
    {
      id: 'proposal',
      label: 'New work proposal',
      isoAnalogy: 'NP / NWIP',
      description: 'Scope, need, and liaisons recorded before drafting begins.',
    },
    {
      id: 'working_draft',
      label: 'Working draft',
      isoAnalogy: 'WD',
      description: 'Editors iterate normative/informative text under document control.',
    },
    {
      id: 'committee_draft',
      label: 'Committee draft',
      isoAnalogy: 'CD',
      description: 'Internal review by VerbaLab Standards Office and domain experts.',
    },
    {
      id: 'enquiry_draft',
      label: 'Enquiry draft',
      isoAnalogy: 'DIS',
      description: 'Partner and customer comment period with disposition log.',
    },
    {
      id: 'final_draft',
      label: 'Final draft',
      isoAnalogy: 'FDIS',
      description: 'Editorial freeze; only defects and clarity fixes allowed.',
    },
    {
      id: 'published',
      label: 'Published standard',
      isoAnalogy: 'IS (publication)',
      description: 'Versioned normative publication with public changelog.',
    },
    {
      id: 'withdrawn',
      label: 'Withdrawn',
      isoAnalogy: 'Withdrawal',
      description: 'Superseded or retired edition retained for audit history.',
    },
  ];
}

export function vgasNormativeDocumentStructure() {
  return [
    { clause: '0', title: 'Foreword', kind: 'informative' },
    { clause: '1', title: 'Scope', kind: 'normative' },
    { clause: '2', title: 'Normative references', kind: 'normative' },
    { clause: '3', title: 'Terms and definitions', kind: 'normative' },
    { clause: '4', title: 'Requirements (shall)', kind: 'normative' },
    { clause: '5', title: 'Recommendations (should)', kind: 'informative' },
    { clause: '6', title: 'Conformance', kind: 'normative' },
    { clause: 'A', title: 'Annex — assessment methods', kind: 'normative' },
    { clause: 'B', title: 'Annex — examples', kind: 'informative' },
  ];
}

export function vgasCertificationScheme() {
  return {
    schemeId: 'VGAS-PCS-001',
    title: 'VerbaLab Personnel Certification Scheme — AI Engineer',
    issuer: 'VerbaLab',
    owner: 'VerbaLab Standards Office',
    status: 'active',
    inspiredBy: [
      'ISO/IEC 17024 principles for personnel certification (competence, impartiality, certificate lifecycle)',
      'ISO/IEC Directives-style document control for normative scheme documents',
    ],
    accreditationStatus: 'not_accredited' as const,
    thirdPartyAccreditation: false,
    isoIeeeW3cRecognition: false,
    elements: [
      { id: 'scheme_doc', title: 'Scheme document under document control', status: 'shipped' },
      { id: 'competence', title: 'Competence requirements (knowledge + practical)', status: 'shipped' },
      { id: 'assessment', title: 'Examination / assessment methods', status: 'shipped' },
      { id: 'decision', title: 'Certification decision rules + pass score', status: 'shipped' },
      { id: 'certificate', title: 'Digital certificate + public verify API', status: 'shipped' },
      { id: 'surveillance', title: 'Surveillance / renewal policy', status: 'shipped' },
      { id: 'suspension', title: 'Suspension / withdrawal / appeals', status: 'shipped' },
      { id: 'impartiality', title: 'Impartiality + conflict-of-interest statement', status: 'shipped' },
    ],
    certificateLifecycle: [
      'application',
      'assessment',
      'decision',
      'issued',
      'surveillance',
      'renewed',
      'suspended',
      'withdrawn',
    ],
    demoCertificateCode: 'VGAS-DEMO-ENGINEER-001',
    verifyPath: '/v1/global-ai-standards/verify/:code',
    disclaimer:
      'Certificates are VerbaLab-issued under this scheme. They are not ISO-accredited credentials and must not be represented as government or SDO recognition.',
  };
}

export function vgasRecognitionPathway() {
  return {
    currentState: {
      isoProcessMaturity: true,
      internationalStandardAdoption: false,
      isoIeeeW3cRecognition: false,
      thirdPartyAccreditation: false,
    },
    whatSoftwareDelivers: [
      'Document-controlled standards repository with stage codes',
      'Normative clause structure and conformance statements',
      'Personnel certification scheme with public verification',
      'Partner comment / enquiry workflow records',
      'Audit pack and honesty flags preventing false recognition claims',
    ],
    whatRequiresExternalBodies: [
      {
        step: 'National body / SDO liaison',
        owner: 'external',
        note: 'Submit new work item or PAS/TS track via a recognized standards body.',
      },
      {
        step: 'Multi-stakeholder ballot and consensus',
        owner: 'external',
        note: 'Other companies, governments, and experts must adopt and vote — not Cursor output.',
      },
      {
        step: 'Publication as ISO/IEC (or regional) deliverable',
        owner: 'external',
        note: 'Only the standards body can grant international standard status.',
      },
      {
        step: 'Accreditation of certification body (e.g. ISO/IEC 17024)',
        owner: 'external',
        note: 'Requires an independent accreditation body assessment of the scheme and CB.',
      },
    ],
    note:
      'VGAS meets ISO-level process rigor inside VerbaLab. External recognition remains a multi-year institutional path.',
  };
}

export function vgasIsoProcessBundle() {
  return {
    product: 'VerbaLab Global AI Standards — ISO process maturity',
    honesty: {
      isoProcessMaturity: true,
      internationalStandardAdoption: false,
      isoIeeeW3cRecognition: false,
      thirdPartyAccreditation: false,
    },
    documentStages: vgasDocumentStages(),
    normativeStructure: vgasNormativeDocumentStructure(),
    certificationScheme: vgasCertificationScheme(),
    recognitionPathway: vgasRecognitionPathway(),
    docs: [
      '/docs/vgas-audit/ISO_PROCESS_MATURITY.md',
      '/docs/vgas-audit/CERTIFICATION_GUIDE.md',
      '/docs/adr/0276-vgas-iso-process-maturity.md',
    ],
    note:
      'ISO-aligned process maturity shipped. Recognition/accreditation flags remain false until external bodies act.',
  };
}
