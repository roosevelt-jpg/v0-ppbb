export interface SmartCityPlatformEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
