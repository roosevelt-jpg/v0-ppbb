export function partnerConnectorsHonesty() {
  return {
    ownedModels: true,
    partnerConnectorApis: true,
    mcpServer: true,
    cliSdkRest: true,
    listingRegistry: true,
    installInvokePaths: true,
    liveHiggsfieldContractSigned: false,
    liveClaudePluginStoreListing: false,
    zapierIpaasOs: false,
    note:
      'Ships VerbaLab-owned partner connector contracts + MCP/CLI/REST over Own AI with listing registry and install/invoke paths. Named platforms are first-class integration targets; signed production partnerships remain deploy/business steps.',
  };
}

export type PartnerPlatform = {
  id: string;
  name: string;
  kind: 'video' | 'llm' | 'agent' | 'creative' | 'custom';
  status: 'shipped' | 'ready';
  protocols: Array<'rest' | 'mcp' | 'cli' | 'sdk' | 'webhook'>;
  useCases: string[];
  docs: string;
  api: string;
};

/** First-class platforms that integrate *into* VerbaLab Own AI. */
export const PARTNER_PLATFORMS: PartnerPlatform[] = [
  {
    id: 'higgsfield',
    name: 'Higgsfield',
    kind: 'video',
    status: 'shipped',
    protocols: ['rest', 'mcp', 'cli', 'sdk', 'webhook'],
    useCases: ['video dubbing', 'multilingual voiceover', 'subtitle MT', 'African accents'],
    docs: '/docs/PARTNER_CONNECTORS.md#higgsfield',
    api: '/v1/partner-connectors/platforms/higgsfield',
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    kind: 'llm',
    status: 'shipped',
    protocols: ['rest', 'mcp', 'cli', 'sdk'],
    useCases: ['MCP tools', 'agent translate/TTS', 'African language assist'],
    docs: '/docs/PARTNER_CONNECTORS.md#claude',
    api: '/v1/partner-connectors/platforms/claude',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    kind: 'agent',
    status: 'shipped',
    protocols: ['mcp', 'cli', 'sdk', 'rest'],
    useCases: ['IDE MCP tools', 'localize product copy', 'voice/video pipeline'],
    docs: '/docs/PARTNER_CONNECTORS.md#cursor',
    api: '/v1/partner-connectors/platforms/cursor',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT / OpenAI Agents',
    kind: 'llm',
    status: 'shipped',
    protocols: ['rest', 'mcp', 'cli', 'sdk'],
    useCases: ['tool calling', 'multilingual assistants'],
    docs: '/docs/PARTNER_CONNECTORS.md#chatgpt',
    api: '/v1/partner-connectors/platforms/chatgpt',
  },
  {
    id: 'runway',
    name: 'Runway',
    kind: 'video',
    status: 'shipped',
    protocols: ['rest', 'mcp', 'cli', 'sdk', 'webhook'],
    useCases: ['video voice', 'subtitle localization'],
    docs: '/docs/PARTNER_CONNECTORS.md#runway',
    api: '/v1/partner-connectors/platforms/runway',
  },
  {
    id: 'pika',
    name: 'Pika',
    kind: 'video',
    status: 'shipped',
    protocols: ['rest', 'mcp', 'cli', 'sdk', 'webhook'],
    useCases: ['short-form dubbing', 'TTS overlays'],
    docs: '/docs/PARTNER_CONNECTORS.md#pika',
    api: '/v1/partner-connectors/platforms/pika',
  },
  {
    id: 'luma',
    name: 'Luma',
    kind: 'video',
    status: 'shipped',
    protocols: ['rest', 'mcp', 'cli', 'sdk', 'webhook'],
    useCases: ['cinematic voice localization'],
    docs: '/docs/PARTNER_CONNECTORS.md#luma',
    api: '/v1/partner-connectors/platforms/luma',
  },
  {
    id: 'kling',
    name: 'Kling',
    kind: 'video',
    status: 'shipped',
    protocols: ['rest', 'mcp', 'cli', 'sdk', 'webhook'],
    useCases: ['multilingual video voice'],
    docs: '/docs/PARTNER_CONNECTORS.md#kling',
    api: '/v1/partner-connectors/platforms/kling',
  },
  {
    id: 'heygen',
    name: 'HeyGen',
    kind: 'video',
    status: 'shipped',
    protocols: ['rest', 'mcp', 'cli', 'sdk', 'webhook'],
    useCases: ['avatar voice localization', 'clone + TTS'],
    docs: '/docs/PARTNER_CONNECTORS.md#heygen',
    api: '/v1/partner-connectors/platforms/heygen',
  },
  {
    id: 'synthesia',
    name: 'Synthesia',
    kind: 'video',
    status: 'shipped',
    protocols: ['rest', 'mcp', 'cli', 'sdk', 'webhook'],
    useCases: ['enterprise video localization'],
    docs: '/docs/PARTNER_CONNECTORS.md#synthesia',
    api: '/v1/partner-connectors/platforms/synthesia',
  },
  {
    id: 'custom',
    name: 'Custom partner',
    kind: 'custom',
    status: 'shipped',
    protocols: ['rest', 'mcp', 'cli', 'sdk', 'webhook'],
    useCases: ['any platform via OpenAPI + MCP'],
    docs: '/docs/PARTNER_CONNECTORS.md#custom',
    api: '/v1/partner-connectors/platforms/custom',
  },
];

export function partnerConnectorsCatalog() {
  return {
    id: 'verbalab-partner-connectors',
    title: 'VerbaLab Partner Connectors',
    blurb:
      'Own-AI connector APIs for video/LLM/agent platforms — REST, MCP, CLI, SDK, and webhooks. Higgsfield, Claude, Cursor, Runway, and the rest plug in as first-class partners.',
    honesty: partnerConnectorsHonesty(),
    docs: '/docs/PARTNER_CONNECTORS.md',
    adr: '/docs/adr/0326-verbalab-partner-connectors.md',
    endpoints: {
      engine: '/v1/partner-connectors/engine',
      platforms: '/v1/partner-connectors/platforms',
      registry: '/v1/partner-connectors/registry',
      tools: '/v1/partner-connectors/tools',
      invoke: '/v1/partner-connectors/invoke',
      mcp: '/v1/partner-connectors/mcp',
      mcpManifest: '/v1/partner-connectors/mcp/manifest',
      install: '/v1/partner-connectors/installations',
      webhooks: '/v1/partner-connectors/webhooks/test',
    },
  };
}
