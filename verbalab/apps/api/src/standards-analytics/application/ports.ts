export type StandardsAnalyticsProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type StandardsAnalyticsEngineBundle = ReturnType<
  import('../standards-analytics.service').StandardsAnalyticsService['engine']
>;

export interface StandardsAnalyticsCatalogPort {
  engine(): StandardsAnalyticsEngineBundle | Promise<StandardsAnalyticsEngineBundle>;
  listProducts(): StandardsAnalyticsProductRow[] | Promise<StandardsAnalyticsProductRow[]>;
}

export const STANDARDS_ANALYTICS_CATALOG_PORT = Symbol('STANDARDS_ANALYTICS_CATALOG_PORT');
