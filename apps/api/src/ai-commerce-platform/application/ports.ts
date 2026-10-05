export interface AiCommercePlatformEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
