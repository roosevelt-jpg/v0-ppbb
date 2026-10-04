export interface GlobalAiFederationEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
