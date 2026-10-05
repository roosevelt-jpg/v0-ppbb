export const CONNECTOR_TYPES = [
  'slack',
  'webhook',
  'http',
  'discord',
  'email',
  'teams',
  'gmail',
  'google_drive',
  'office365',
] as const;
export type ConnectorType = (typeof CONNECTOR_TYPES)[number];

export function isConnectorType(value: string): value is ConnectorType {
  return (CONNECTOR_TYPES as readonly string[]).includes(value);
}

export type ConnectorDefinition = {
  type: ConnectorType;
  name: string;
  status: 'shipped';
  description: string;
  installPath: string;
  invokePath: string;
  notes: string;
};

export const CONNECTOR_REGISTRY: ConnectorDefinition[] = [
  {
    type: 'slack',
    name: 'Slack',
    status: 'shipped',
    description: 'Slash-command translate into a Slack channel (signed events).',
    installPath: '/v1/connectors/slack/install',
    invokePath: '/v1/connectors/slack/invoke',
    notes: 'Also available via legacy /v1/connectors/slack/installations and /commands.',
  },
  {
    type: 'webhook',
    name: 'Outbound Webhook',
    status: 'shipped',
    description: 'Signed JSON webhook delivery to a customer HTTPS endpoint.',
    installPath: '/v1/connectors/webhook/install',
    invokePath: '/v1/connectors/webhook/invoke',
    notes: 'Uses org webhook signing secret.',
  },
  {
    type: 'http',
    name: 'HTTP Request',
    status: 'shipped',
    description: 'Generic HTTPS request connector for partner APIs.',
    installPath: '/v1/connectors/http/install',
    invokePath: '/v1/connectors/http/invoke',
    notes: 'Outbound GET/POST only; no iPaaS orchestration.',
  },
  {
    type: 'discord',
    name: 'Discord',
    status: 'shipped',
    description: 'Discord incoming webhook posts for translate replies.',
    installPath: '/v1/connectors/discord/install',
    invokePath: '/v1/connectors/discord/invoke',
    notes: 'Install with an incoming webhook URL.',
  },
  {
    type: 'email',
    name: 'Email',
    status: 'shipped',
    description: 'Email notify connector for workflow and ops messages.',
    installPath: '/v1/connectors/email/install',
    invokePath: '/v1/connectors/email/invoke',
    notes: 'Uses NotificationsService / Resend when configured.',
  },
  {
    type: 'teams',
    name: 'Microsoft Teams',
    status: 'shipped',
    description: 'Teams command translate replies (sandbox adapter).',
    installPath: '/v1/connectors/teams/install',
    invokePath: '/v1/connectors/teams/invoke',
    notes: 'Also available via POST /v1/connectors/teams/commands.',
  },
  {
    type: 'gmail',
    name: 'Gmail',
    status: 'shipped',
    description: 'Connect a Gmail mailbox to share threads with African Voice LLM and translate.',
    installPath: '/v1/connectors/gmail/install',
    invokePath: '/v1/connectors/gmail/invoke',
    notes: 'OAuth sandbox install; list/share/translate actions via invoke.',
  },
  {
    type: 'google_drive',
    name: 'Google Drive',
    status: 'shipped',
    description: 'Connect Google Drive to open docs into chat for translation and Q&A.',
    installPath: '/v1/connectors/google_drive/install',
    invokePath: '/v1/connectors/google_drive/invoke',
    notes: 'OAuth sandbox install; list/share/translate actions via invoke.',
  },
  {
    type: 'office365',
    name: 'Microsoft 365',
    status: 'shipped',
    description: 'Connect Outlook / OneDrive / Office files to share and translate with the LLM.',
    installPath: '/v1/connectors/office365/install',
    invokePath: '/v1/connectors/office365/invoke',
    notes: 'OAuth sandbox install for Office tools; list/share/translate via invoke.',
  },
];

export type ConnectorInstallation = {
  id: string;
  type: ConnectorType;
  organizationId: string;
  workspaceId: string;
  label: string;
  config: Record<string, unknown>;
  status: 'active' | 'paused';
  createdAt: string;
  updatedAt: string;
};
