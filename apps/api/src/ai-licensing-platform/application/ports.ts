export interface AiLicensingPlatformEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
