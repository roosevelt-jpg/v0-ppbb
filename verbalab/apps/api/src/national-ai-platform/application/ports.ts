export interface NationalAiPlatformEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
