export interface AiInvestmentPlatformEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
