export type VgasSeed = {
  domain: string;
  kind: string;
  title: string;
  status: string;
  summary: string;
  ownerLabel: string;
  verifyCode?: string;
  content: Record<string, unknown>;
};

export function vgasDefaultSeeds(): VgasSeed[] {
  return [
    {
      domain: 'foundation',
      kind: 'african_ai_standard',
      title: 'African AI Standard v0.1',
      status: 'committee_draft',
      summary: 'VerbaLab draft standard for African language/voice AI systems under ISO-aligned document control.',
      ownerLabel: 'Standards Office (role)',
      content: {
        stage: 'committee_draft',
        isoAnalogy: 'CD',
        internationalStandardAdoption: false,
        clauses: ['scope', 'terms', 'requirements', 'conformance'],
      },
    },
    {
      domain: 'foundation',
      kind: 'voice_ai_standard',
      title: 'Voice AI Standard - consent and provenance',
      status: 'published',
      summary: 'Consent, watermarking, and provenance requirements (normative shall clauses).',
      ownerLabel: 'Standards Office (role)',
      content: {
        stage: 'published',
        isoAnalogy: 'IS (publication)',
        checklist: ['consent', 'watermark', 'abuse_review'],
        normative: true,
      },
    },
    {
      domain: 'foundation',
      kind: 'document_control',
      title: 'VGAS Document Control Manual',
      status: 'published',
      summary: 'Stage codes, comment disposition, and edition history for VerbaLab standards.',
      ownerLabel: 'Standards Office (role)',
      content: {
        stages: ['proposal', 'working_draft', 'committee_draft', 'enquiry_draft', 'final_draft', 'published', 'withdrawn'],
        isoProcessMaturity: true,
        isoIeeeW3cRecognition: false,
      },
    },
    {
      domain: 'certification',
      kind: 'scheme',
      title: 'Personnel Certification Scheme — AI Engineer (VGAS-PCS-001)',
      status: 'active',
      summary: 'ISO/IEC 17024-inspired scheme document for VerbaLab AI Engineer credentials.',
      ownerLabel: 'Certification (role)',
      content: {
        schemeId: 'VGAS-PCS-001',
        accreditationStatus: 'not_accredited',
        thirdPartyAccreditation: false,
        lifecycle: ['application', 'assessment', 'decision', 'issued', 'surveillance', 'renewed', 'suspended', 'withdrawn'],
      },
    },
    {
      domain: 'certification',
      kind: 'learning_path',
      title: 'Learning path - African Language Specialist',
      status: 'active',
      summary: 'Courses for African-language speech and localization.',
      ownerLabel: 'Certification (role)',
      content: { thirdPartyAccreditation: false },
    },
    {
      domain: 'certification',
      kind: 'certificate',
      title: 'Certificate - VerbaLab AI Engineer (sample)',
      status: 'issued',
      summary: 'Sample VerbaLab-issued certificate for verification demos under VGAS-PCS-001.',
      ownerLabel: 'Certification (role)',
      verifyCode: 'VGAS-DEMO-ENGINEER-001',
      content: {
        issuedBy: 'VerbaLab',
        schemeId: 'VGAS-PCS-001',
        isoProcessMaturity: true,
        thirdPartyAccreditation: false,
        isoIeeeW3cRecognition: false,
        disclaimer: 'VerbaLab-issued under ISO-aligned scheme — not ISO/IEEE/government accreditation.',
      },
    },
    {
      domain: 'certification',
      kind: 'exam',
      title: 'Exam - Prompt Engineer fundamentals',
      status: 'active',
      summary: 'Exam for prompt practice in African CX scenarios.',
      ownerLabel: 'Certification (role)',
      content: { passScore: 80, schemeId: 'VGAS-PCS-001' },
    },
    { domain: 'compliance', kind: 'gap_analysis', title: 'Gap analysis - Responsible AI for voice cloning', status: 'open', summary: 'Self-assessment against VerbaLab Responsible AI checklist.', ownerLabel: 'Trust (role)', content: { score: 72 } },
    { domain: 'compliance', kind: 'safety_check', title: 'Safety assessment - public speech TTS', status: 'active', summary: 'Safety review template for civic messaging.', ownerLabel: 'Safety (role)', content: { controls: ['moderation', 'provenance'] } },
    { domain: 'reference', kind: 'government_ai', title: 'Blueprint - Citizen services multilingual IVR', status: 'published', summary: 'Government call-center reference architecture.', ownerLabel: 'Solutions Architecture', content: { planes: ['speech', 'translate', 'trust'] } },
    { domain: 'reference', kind: 'banking_ai', title: 'Blueprint - Banking KYC voice and consent', status: 'published', summary: 'Banking vertical with residency and consent gates.', ownerLabel: 'Solutions Architecture', content: { regulated: true } },
    { domain: 'practices', kind: 'rag_pattern', title: 'Pattern - Multilingual RAG with glossary grounding', status: 'active', summary: 'African-language RAG pattern with glossaries.', ownerLabel: 'Engineering Manual', content: { tags: ['rag', 'glossary'] } },
    { domain: 'practices', kind: 'voice_pattern', title: 'Pattern - Ethical voice clone launch checklist', status: 'active', summary: 'Consent, watermark, abuse review checklist.', ownerLabel: 'Engineering Manual', content: { steps: ['consent', 'watermark', 'review'] } },
    { domain: 'assessment', kind: 'ai_readiness', title: 'Assessment - Telco AI readiness (sample)', status: 'active', summary: 'Maturity assessment for telco language/voice rollout.', ownerLabel: 'Customer Success', content: { score: 61 } },
    { domain: 'assessment', kind: 'language_readiness', title: 'Assessment - Language readiness for education TTS', status: 'active', summary: 'Mother-tongue lesson TTS readiness checks.', ownerLabel: 'Education Solutions', content: { languages: ['yo', 'sw', 'am'] } },
    { domain: 'repository', kind: 'specification', title: 'Spec - VerbaLab Language AI Standard outline', status: 'draft', summary: 'Versioned specification outline.', ownerLabel: 'Standards Repo', content: { version: '0.1.0' } },
    { domain: 'repository', kind: 'model_card', title: 'Model card template - African STT', status: 'active', summary: 'Template for STT dialect coverage docs.', ownerLabel: 'Research', content: { fields: ['languages', 'accents', 'eval'] } },
    { domain: 'partner', kind: 'university', title: 'Partner - University language lab (sample)', status: 'active', summary: 'University partnership for datasets.', ownerLabel: 'Partnerships', content: { region: 'East Africa' } },
    { domain: 'partner', kind: 'language_institute', title: 'Partner - Language institute (sample)', status: 'prospect', summary: 'Institute partnership for lexicons.', ownerLabel: 'Partnerships', content: { focus: ['lexicons'] } },
    { domain: 'analytics', kind: 'certification_metric', title: 'Metric - Certificates issued (demo)', status: 'active', summary: 'Demo metric for VerbaLab-issued certificates.', ownerLabel: 'Standards Analytics', content: { value: 1, thirdPartyAccreditation: false } },
    { domain: 'analytics', kind: 'country_metric', title: 'Metric - Countries with active partners (demo)', status: 'active', summary: 'Demo partner footprint metric.', ownerLabel: 'Standards Analytics', content: { value: 3 } },
  ];
}
