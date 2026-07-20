export interface SearchResult {
  id: number;
  title: string;
  title_marked: string | null;
  body: string;
  body_marked: string | null;
  category: string;
  author: string;
  permlink: string;
  author_rep: number;
  total_payout: number;
  payout: number;
  total_votes: number;
  up_votes: number;
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
