export type StrategicPlanningPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type StrategicPlanningPlatformEngineBundle = ReturnType<
  import('../strategic-planning-platform.service').StrategicPlanningPlatformService['engine']
>;

export interface StrategicPlanningPlatformCatalogPort {
  engine(): StrategicPlanningPlatformEngineBundle | Promise<StrategicPlanningPlatformEngineBundle>;
  listProducts(): StrategicPlanningPlatformProductRow[] | Promise<StrategicPlanningPlatformProductRow[]>;
}

export const STRATEGIC_PLANNING_PLATFORM_CATALOG_PORT = Symbol('STRATEGIC_PLANNING_PLATFORM_CATALOG_PORT');
