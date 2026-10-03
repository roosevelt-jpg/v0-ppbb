export interface GlobalLanguagePreservationEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
