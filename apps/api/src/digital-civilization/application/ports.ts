export interface DigitalCivilizationEnginePort {
  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;
}
