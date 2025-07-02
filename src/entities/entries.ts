export interface EntryBeneficiaryRoute {
  account: string;
  weight: number;
}

export interface EntryVote {
  voter: string;
  rshares: number;
}

export interface EntryStat {
  flag_weight: number;
  gray: boolean;
  hide: boolean;
  total_votes: number;
  is_pinned?: boolean;
}

export interface JsonMetadata {
  tags?: string[];
  description?: string | null;
  app?: any;
  canonical_url?: string;
  format?: string;
  original_author?: string;
  original_permlink?: string;
  image?: string[];
  pinned_reply?: string; // author/permlink
  location?: { coordinates: { lat: number; lng: number }; address?: string };
}

export interface JsonPollMetadata {
  content_type: "poll";
  version: number;
  question: string;
  choices: string[];
  preferred_interpretation: string;
  token: string;
  vote_change: boolean;
  hide_votes: boolean;
  filters: { account_age: number };
  end_time: number;
}

export interface Entry {
  last_update?: string;
  active_votes: EntryVote[];
  author: string;
  author_payout_value: string;
  author_reputation: number;
  author_role?: string;
  author_title?: string;
  beneficiaries: EntryBeneficiaryRoute[];
  blacklists: string[];
  body: string;
  category: string;
  children: number;
  community?: string;
  community_title?: string;
  created: string;
  total_votes?: number;
  curator_payout_value: string;
  depth: number;
  is_paidout: boolean;
  json_metadata: JsonMetadata;
  max_accepted_payout: string;
  net_rshares: number;
  parent_author?: string;
  parent_permlink?: string;
  payout: number;
  payout_at: string;
  pending_payout_value: string;
  percent_hbd: number;
  permlink: string;
  post_id: any;
  id?: number;
  num?: number;
  promoted: string;
  reblogs?: number;
  reblogged_by?: string[] | any;
  replies: any[];
  stats: EntryStat;
  title: string;
  updated?: string;
  url: string;
  original_entry?: Entry;
  is_optimistic?: boolean;
}

export interface EntryHeader {
  author: string;
  category: string;
  permlink: string;
  depth: number;
}

export interface EntryGroup {
  // filter(arg0: (entry: any) => boolean): EntryGroup;
  entries: Entry[];
  error: string | null;
  sid: string; //scroll_id for controversial/rising results
  loading: boolean;
  hasMore: boolean;
}

export interface Entries extends Record<string, EntryGroup> {}
