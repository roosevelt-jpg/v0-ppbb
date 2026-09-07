export type SttInput = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  language?: string;
};

export type SttOutput = {
  text: string;
  language?: string;
  durationSeconds: number;
  provider: string;
  latencyMs: number;
};

export interface SttProvider {
  readonly name: string;
  transcribe(input: SttInput): Promise<SttOutput>;
}
