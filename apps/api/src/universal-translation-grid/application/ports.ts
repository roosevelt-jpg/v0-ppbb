export interface UniversalTranslationGridEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
