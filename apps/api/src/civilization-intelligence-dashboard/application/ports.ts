export interface CivilizationIntelligenceDashboardEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
