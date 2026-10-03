export interface RevenueSharingPlatformEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
