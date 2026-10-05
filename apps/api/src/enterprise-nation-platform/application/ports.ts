export interface EnterpriseNationPlatformEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
