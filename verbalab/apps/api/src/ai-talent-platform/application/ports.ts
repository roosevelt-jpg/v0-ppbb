export interface AiTalentPlatformEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
