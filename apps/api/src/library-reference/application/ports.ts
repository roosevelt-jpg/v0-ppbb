export interface LibraryReferenceEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
