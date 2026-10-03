export type NavItem = {
  href: string;
  label: string;
  keywords?: string[];
  /** Only show for org owner/admin sessions. */
  adminOnly?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  /** When true, group starts collapsed unless a child is active or user is searching. */
  collapsible?: boolean;
  /** Hide entire group unless the viewer is an admin/owner. */
  adminOnly?: boolean;
  items: NavItem[];
};

/** Product-first IA. Full volume inventory stays available under Platform / Clouds. */
export const CONSOLE_NAV: NavGroup[] = [
  {
    id: 'home',
    label: 'Home',
    items: [
      { href: '/dashboard', label: 'Dashboard', keywords: ['home', 'overview', 'usage'] },
      { href: '/playground', label: 'Playground', keywords: ['try', 'sandbox'] },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    items: [
      { href: '/translate', label: 'Translate', keywords: ['mt', 'localization', 'text'] },
      { href: '/voice-studio', label: 'Voice', keywords: ['tts', 'studio', 'clone', 'ssml'] },
      { href: '/speech', label: 'Speech', keywords: ['stt', 'asr', 'transcription', 'audio'] },
      { href: '/language', label: 'Language', keywords: ['dialects', 'grammar', 'style'] },
      { href: '/chat', label: 'Chat', keywords: ['llm', 'assistant'] },
      { href: '/intelligence-cloud', label: 'Intelligence', keywords: ['reasoning', 'memory'] },
      { href: '/knowledge-cloud', label: 'Knowledge', keywords: ['rag', 'search', 'ontology'] },
    ],
  },
  {
    id: 'create',
    label: 'Create & ops',
    items: [
      { href: '/prompts', label: 'Prompts' },
      { href: '/datasets', label: 'Datasets' },
      { href: '/finetunes', label: 'Fine-tunes' },
      { href: '/models', label: 'Models' },
      { href: '/workflows', label: 'Workflows' },
      { href: '/connectors', label: 'Connectors' },
      { href: '/marketplace', label: 'Marketplace' },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      { href: '/usage', label: 'Usage' },
      { href: '/analytics', label: 'Analytics' },
      { href: '/billing', label: 'Billing' },
      { href: '/keys', label: 'API keys' },
      { href: '/developers', label: 'Developers' },
      { href: '/identity', label: 'Identity' },
      { href: '/data', label: 'Data & residency' },
      { href: '/audit', label: 'Audit' },
      { href: '/admin', label: 'Admin' },
      { href: '/docs', label: 'Docs' },
    ],
  },
  {
    id: 'admin-tools',
    label: 'Admin',
    collapsible: true,
    adminOnly: true,
    items: [
      {
        href: '/cms',
        label: 'Marketing CMS',
        keywords: ['content', 'blocks', 'assets', 'theme', 'admin'],
        adminOnly: true,
      },
    ],
  },
  {
    id: 'voice-stack',
    label: 'Voice stack',
    collapsible: true,
    items: [
      { href: '/voice-cloud', label: 'Voice Cloud' },
      { href: '/neural-tts', label: 'Neural TTS' },
      { href: '/voice-cloning', label: 'Voice Cloning' },
      { href: '/emotion-voice', label: 'Emotion Voice' },
      { href: '/speech-recognition', label: 'Speech Recognition' },
      { href: '/audio', label: 'Audio studio' },
      { href: '/interpret', label: 'Interpreter' },
      { href: '/voice-marketplace', label: 'Voice Marketplace' },
      { href: '/voice-analytics', label: 'Voice Analytics' },
      { href: '/wake-word', label: 'Wake Word' },
      { href: '/call-intelligence', label: 'Call Intelligence' },
      { href: '/speech-analytics', label: 'Speech Analytics' },
    ],
  },
  {
    id: 'language-stack',
    label: 'Language stack',
    collapsible: true,
    items: [
      { href: '/translate/formats', label: 'Formats' },
      { href: '/glossary', label: 'Glossary' },
      { href: '/tm', label: 'Translation Memory' },
      { href: '/reviews', label: 'Reviews' },
      { href: '/localize', label: 'Localize' },
      { href: '/localization', label: 'Localization' },
      { href: '/documents', label: 'Documents' },
      { href: '/ocr', label: 'OCR' },
      { href: '/locales', label: 'Locales' },
      { href: '/registry', label: 'Language Registry' },
      { href: '/dialects', label: 'Dialects' },
      { href: '/accents', label: 'Accents' },
      { href: '/grammar', label: 'Grammar' },
      { href: '/style', label: 'Style' },
      { href: '/countries', label: 'Countries' },
    ],
  },
  {
    id: 'clouds-12-15',
    label: 'Clouds · Vol 12–15',
    collapsible: true,
    items: [
      { href: '/african-intelligence-cloud', label: 'African Intelligence' },
      { href: '/african-language-registry', label: 'African Lang Registry' },
      { href: '/cultural-intelligence', label: 'Cultural Intelligence' },
      { href: '/african-knowledge-graph', label: 'Africa Knowledge Graph' },
      { href: '/government-intelligence', label: 'Government Intel' },
      { href: '/healthcare-intelligence', label: 'Healthcare Intel' },
      { href: '/financial-intelligence', label: 'Financial Intel' },
      { href: '/education-intelligence', label: 'Education Intel' },
      { href: '/agricultural-intelligence', label: 'Agricultural Intel' },
      { href: '/tourism-heritage-intelligence', label: 'Tourism & Heritage' },
      { href: '/research-cloud', label: 'Research Cloud' },
      { href: '/experiment-platform', label: 'Experiments' },
      { href: '/synthetic-data-platform', label: 'Synthetic Data' },
      { href: '/benchmark-platform', label: 'Benchmarks' },
      { href: '/evaluation-platform', label: 'Evaluation' },
      { href: '/ai-publication-platform', label: 'Publications' },
      { href: '/patent-innovation-platform', label: 'Patents' },
      { href: '/open-science-platform', label: 'Open Science' },
      { href: '/research-analytics', label: 'Research Analytics' },
      { href: '/mlops-llmops-cloud', label: 'MLOps / LLMOps' },
      { href: '/dataset-pipeline', label: 'Dataset Pipeline' },
      { href: '/training-pipeline', label: 'Training Pipeline' },
      { href: '/continuous-evaluation', label: 'Continuous Eval' },
      { href: '/promptops-platform', label: 'PromptOps' },
      { href: '/ragops-platform', label: 'RAGOps' },
      { href: '/agentops-platform', label: 'AgentOps' },
      { href: '/ai-drift-detection', label: 'Drift Detection' },
      { href: '/continuous-learning', label: 'Continuous Learning' },
      { href: '/ai-operations-dashboard', label: 'AI Ops Dashboard' },
      { href: '/trust-cloud', label: 'Trust Cloud' },
      { href: '/ai-safety-platform', label: 'AI Safety' },
      { href: '/ai-governance-platform', label: 'AI Governance' },
      { href: '/explainability-platform', label: 'Explainability' },
      { href: '/privacy-platform', label: 'Privacy' },
      { href: '/compliance-platform', label: 'Compliance' },
      { href: '/risk-intelligence', label: 'Risk Intelligence' },
      { href: '/identity-federation', label: 'Identity Federation' },
      { href: '/trust-analytics', label: 'Trust Analytics' },
    ],
  },
  {
    id: 'clouds-16-20',
    label: 'Clouds · Vol 16–20',
    collapsible: true,
    items: [
      { href: '/platform-engineering-cloud', label: 'Platform Engineering' },
      { href: '/internal-developer-portal', label: 'Dev Portal' },
      { href: '/service-catalog', label: 'Service Catalog' },
      { href: '/golden-path-platform', label: 'Golden Paths' },
      { href: '/gitops-platform', label: 'GitOps' },
      { href: '/release-engineering', label: 'Release Engineering' },
      { href: '/reliability-engineering', label: 'Reliability' },
      { href: '/finops-platform', label: 'FinOps' },
      { href: '/supply-chain-security', label: 'Supply Chain' },
      { href: '/developer-experience-platform', label: 'DevEx' },
      { href: '/platform-engineering-analytics', label: 'PE Analytics' },
      { href: '/control-plane-cloud', label: 'Control Plane' },
      { href: '/organization-control', label: 'Org Control' },
      { href: '/global-configuration-platform', label: 'Global Config' },
      { href: '/global-policy-engine', label: 'Global Policy' },
      { href: '/global-deployment-controller', label: 'Global Deploy' },
      { href: '/global-routing-controller', label: 'Global Routing' },
      { href: '/secrets-certificate-platform', label: 'Secrets & Certs' },
      { href: '/global-scheduler', label: 'Global Scheduler' },
      { href: '/control-plane-analytics', label: 'CP Analytics' },
      { href: '/data-plane-cloud', label: 'Data Plane' },
      { href: '/translation-runtime', label: 'Translation Runtime' },
      { href: '/speech-runtime', label: 'Speech Runtime' },
      { href: '/voice-runtime', label: 'Voice Runtime' },
      { href: '/vision-runtime', label: 'Vision Runtime' },
      { href: '/knowledge-runtime', label: 'Knowledge Runtime' },
      { href: '/embedding-runtime', label: 'Embedding Runtime' },
      { href: '/data-plane-streaming', label: 'DP Streaming' },
      { href: '/gpu-runtime', label: 'GPU Runtime' },
      { href: '/vaios', label: 'VAIOS' },
      { href: '/ai-scheduler', label: 'AI Scheduler' },
      { href: '/runtime-manager', label: 'Runtime Manager' },
      { href: '/resource-manager', label: 'Resource Manager' },
      { href: '/workflow-operating-system', label: 'Workflow OS' },
      { href: '/agent-operating-system', label: 'Agent OS' },
      { href: '/ai-memory-operating-system', label: 'Memory OS' },
      { href: '/knowledge-operating-system', label: 'Knowledge OS' },
      { href: '/plugin-operating-system', label: 'Plugin OS' },
      { href: '/enterprise-engineering-system', label: 'Enterprise Eng System' },
      { href: '/engineering-governance', label: 'Eng Governance' },
      { href: '/architecture-governance', label: 'Arch Governance' },
      { href: '/repository-standards', label: 'Repo Standards' },
      { href: '/engineering-quality-platform', label: 'Eng Quality' },
      { href: '/ai-engineering-standards', label: 'AI Eng Standards' },
      { href: '/api-engineering-standards', label: 'API Standards' },
      { href: '/database-engineering-standards', label: 'DB Standards' },
      { href: '/infrastructure-engineering-standards', label: 'Infra Standards' },
      { href: '/corporate-operating-system', label: 'VCOS' },
      { href: '/corporate-governance-platform', label: 'Corp Governance' },
      { href: '/strategic-planning-platform', label: 'Strategy' },
      { href: '/enterprise-portfolio-management', label: 'Portfolio' },
      { href: '/business-architecture', label: 'Biz Architecture' },
      { href: '/enterprise-architecture-repository', label: 'EA Repository' },
      { href: '/corporate-knowledge-system', label: 'Corp Knowledge' },
      { href: '/executive-intelligence-platform', label: 'Exec Intelligence' },
      { href: '/corporate-risk-platform', label: 'Corp Risk' },
      { href: '/global-ai-standards', label: 'VGAS' },
      { href: '/ai-certification-platform', label: 'Certification' },
      { href: '/ai-compliance-framework', label: 'AI Compliance' },
      { href: '/reference-architectures', label: 'Ref Architectures' },
      { href: '/best-practices-library', label: 'Best Practices' },
      { href: '/enterprise-assessment-platform', label: 'Assessments' },
      { href: '/standards-repository', label: 'Standards Repo' },
      { href: '/global-partner-program', label: 'Partners' },
      { href: '/standards-analytics', label: 'Standards Analytics' },
      { href: '/ai-economy', label: 'AI Economy' },
      { href: '/ai-commerce-platform', label: 'AI Commerce' },
      { href: '/ai-licensing-platform', label: 'AI Licensing' },
      { href: '/revenue-sharing-platform', label: 'Revenue Share' },
      { href: '/ai-talent-platform', label: 'AI Talent' },
      { href: '/research-funding-platform', label: 'Research Funding' },
      { href: '/global-community-platform', label: 'Community' },
      { href: '/ai-investment-platform', label: 'Investment Dash' },
      { href: '/economic-intelligence', label: 'Econ Intel' },
      { href: '/digital-civilization', label: 'Civilization' },
      { href: '/national-ai-platform', label: 'National AI' },
      { href: '/smart-city-platform', label: 'Smart City' },
      { href: '/enterprise-nation-platform', label: 'Enterprise Nation' },
      { href: '/global-language-preservation', label: 'Lang Preserve' },
      { href: '/universal-translation-grid', label: 'Translation Grid' },
      { href: '/global-knowledge-network', label: 'Knowledge Net' },
      { href: '/global-ai-federation', label: 'AI Federation' },
      { href: '/civilization-intelligence-dashboard', label: 'Civ Intel' },
      { href: '/library-reference', label: 'Library Ref' },
    ],
  },
  {
    id: 'fabric-runtime',
    label: 'Fabric & runtime',
    collapsible: true,
    items: [
      { href: '/ai-kernel', label: 'AI Kernel' },
      { href: '/foundation-model-cloud', label: 'Foundation Models' },
      { href: '/model-training-platform', label: 'Training Platform' },
      { href: '/model-evaluation-platform', label: 'Evaluation Platform' },
      { href: '/model-registry', label: 'Model Registry' },
      { href: '/atlas', label: 'Atlas' },
      { href: '/inference-cloud', label: 'Inference Cloud' },
      { href: '/ai-fabric', label: 'AI Fabric' },
      { href: '/event-fabric', label: 'Event Fabric' },
      { href: '/context-fabric', label: 'Context Fabric' },
      { href: '/knowledge-fabric', label: 'Knowledge Fabric' },
      { href: '/prompt-fabric', label: 'Prompt Fabric' },
      { href: '/reasoning-fabric', label: 'Reasoning Fabric' },
      { href: '/memory-fabric', label: 'Memory Fabric' },
      { href: '/agent-fabric', label: 'Agent Fabric' },
      { href: '/policy-fabric', label: 'Policy Fabric' },
      { href: '/memory-runtime', label: 'Memory Runtime' },
      { href: '/prompt-runtime', label: 'Prompt Runtime' },
      { href: '/context-runtime', label: 'Context Runtime' },
      { href: '/reasoning-runtime', label: 'Reasoning Runtime' },
      { href: '/agent-runtime', label: 'Agent Runtime' },
      { href: '/workflow-runtime', label: 'Workflow Runtime' },
      { href: '/plugin-runtime', label: 'Plugin Runtime' },
      { href: '/policy-runtime', label: 'Policy Runtime' },
      { href: '/gpu-platform', label: 'GPU Platform' },
      { href: '/model-serving', label: 'Model Serving' },
      { href: '/ai-router', label: 'AI Router' },
      { href: '/streaming-runtime', label: 'Streaming Runtime' },
      { href: '/batch-runtime', label: 'Batch Runtime' },
      { href: '/intelligent-cache', label: 'Intelligent Cache' },
      { href: '/cost-optimization', label: 'Cost Optimization' },
      { href: '/ai-runtime-analytics', label: 'Runtime Analytics' },
      { href: '/gateway', label: 'AI Gateway' },
      { href: '/graphql', label: 'GraphQL' },
    ],
  },
  {
    id: 'ecosystem',
    label: 'Ecosystem',
    collapsible: true,
    items: [
      { href: '/ecosystem-cloud', label: 'Ecosystem Cloud' },
      { href: '/plugin-marketplace', label: 'Plugin Market' },
      { href: '/model-marketplace', label: 'Model Market' },
      { href: '/dataset-marketplace', label: 'Dataset Market' },
      { href: '/prompt-marketplace', label: 'Prompt Market' },
      { href: '/agent-marketplace', label: 'Agent Market' },
      { href: '/workflow-marketplace', label: 'Workflow Market' },
      { href: '/connector-marketplace', label: 'Connector Market' },
      { href: '/voice-language-marketplace', label: 'Voice/Lang Market' },
      { href: '/creator-economy', label: 'Creator Economy' },
      { href: '/enterprise', label: 'Enterprise' },
      { href: '/coverage', label: 'Coverage' },
    ],
  },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/dashboard') return false;
  if (href === '/translate') return pathname === '/translate' || pathname.startsWith('/translate?');
  return pathname.startsWith(`${href}/`);
}

export function groupHasActive(pathname: string, group: NavGroup): boolean {
  return group.items.some((item) => isNavItemActive(pathname, item.href) || pathname === item.href || pathname.startsWith(`${item.href}/`));
}

export function filterNav(query: string, opts?: { isAdmin?: boolean }): NavGroup[] {
  const q = query.trim().toLowerCase();
  const isAdmin = Boolean(opts?.isAdmin);
  const base = CONSOLE_NAV.filter((group) => !group.adminOnly || isAdmin).map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || isAdmin),
  }));
  if (!q) return base.filter((group) => group.items.length > 0);
  return base
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const hay = [item.label, item.href, ...(item.keywords ?? [])].join(' ').toLowerCase();
        return hay.includes(q);
      }),
    }))
    .filter((group) => group.items.length > 0);
}
