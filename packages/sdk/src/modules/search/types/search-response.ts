export interface SearchResult {
  id: number;
  title: string;
  // Highlight fields are only present when the query produced a match, and the
  // search response is cast from JSON without validation, so an omitted
  // highlight is `undefined` rather than `null`.
  title_marked?: string | null;
  body: string;
  body_marked?: string | null;
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
