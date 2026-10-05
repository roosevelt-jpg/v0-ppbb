export interface ResearchFundingPlatformEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
