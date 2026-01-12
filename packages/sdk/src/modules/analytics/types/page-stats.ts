export interface PageStatsResponse {
  results: [
    {
      metrics: number[];
      dimensions: string[];
    }
  ];
  query: {
    site_id: string;
    metrics: string[];
    date_range: string[];
    filters: string[];
  };
}
