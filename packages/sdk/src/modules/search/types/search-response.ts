export interface SearchResult {
  id: number;
  title: string;
  body: string;
  category: string;
  author: string;
  permlink: string;
  author_rep: number;
  total_payout: number;
  img_url: string;
  created_at: string;
  children: number;
  tags: string[];
  app: string;
  depth: number;
}

export interface SearchResponse {
  hits: number;
  took: number;
  scroll_id?: string;
  results: SearchResult[];
}
