export interface EconomicIntelligenceEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
