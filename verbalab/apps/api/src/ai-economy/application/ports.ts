export interface AiEconomyEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
