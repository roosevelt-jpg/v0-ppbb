export const WORKFLOW_OPS = [
  'transcribe',
  'translate',
  'notify',
  'embed',
  'summarize',
  'webhook',
  'classify',
  'agent_run',
  'tts',
  'stt',
] as const;
export type WorkflowOp = (typeof WORKFLOW_OPS)[number];

export const WORKFLOW_MAX_STEPS = 12;

export type WorkflowStepBase = {
  id: string;
  op: WorkflowOp;
};

export type TranscribeStep = WorkflowStepBase & {
  op: 'transcribe';
  documentId: string;
  language?: string;
};

export type TranslateStep = WorkflowStepBase & {
  op: 'translate';
  source: string;
  target: string;
  /** Literal text and/or `{{stepId.field}}` placeholders. */
  text: string;
};

export type NotifyStep = WorkflowStepBase & {
  op: 'notify';
  channel: 'email' | 'webhook';
  message: string;
  subject?: string;
  /** Required when channel=webhook. */
  webhookUrl?: string;
};

export type EmbedStep = WorkflowStepBase & {
  op: 'embed';
  text: string;
  model?: string;
};

export type SummarizeStep = WorkflowStepBase & {
  op: 'summarize';
  text: string;
  maxSentences?: number;
};

export type WebhookStep = WorkflowStepBase & {
  op: 'webhook';
  webhookUrl: string;
  event?: string;
  message?: string;
  data?: Record<string, unknown>;
};

export type ClassifyStep = WorkflowStepBase & {
  op: 'classify';
  text: string;
  labels: string[];
};

export type AgentRunStep = WorkflowStepBase & {
  op: 'agent_run';
  goal: string;
  pipeline?: string;
};

export type TtsStep = WorkflowStepBase & {
  op: 'tts';
  text: string;
  voice: string;
  language?: string;
  format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
};

export type SttStep = WorkflowStepBase & {
  op: 'stt';
  documentId: string;
  language?: string;
};

export type WorkflowStep =
  | TranscribeStep
  | TranslateStep
  | NotifyStep
  | EmbedStep
  | SummarizeStep
  | WebhookStep
  | ClassifyStep
  | AgentRunStep
  | TtsStep
  | SttStep;

export type WorkflowInput = {
  workflowId?: string;
  name?: string;
  steps: WorkflowStep[];
};

export type WorkflowStepResult = {
  id: string;
  op: WorkflowOp;
  output: Record<string, unknown>;
};

export type WorkflowResult = {
  workflowId: string | null;
  name: string | null;
  steps: WorkflowStepResult[];
};
