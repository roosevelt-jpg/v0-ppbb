export interface GlobalCommunityPlatformEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
