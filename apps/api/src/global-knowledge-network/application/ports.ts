export interface GlobalKnowledgeNetworkEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
