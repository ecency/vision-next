export interface Witness {
  total_missed: number;
  url: string;
  props: {
    account_creation_fee: string;
    account_subsidy_budget: number;
    maximum_block_size: number;
  };
  hbd_exchange_rate: {
    base: string;
  };
  available_witness_account_subsidies: number;
  running_version: string;
  owner: string;
  signing_key: string;
  last_hbd_exchange_update: string;
  /** Rank by vote weight (only available via REST) */
  rank?: number;
  /** Total vests supporting this witness (only available via REST) */
  vests?: string;
  /** Number of accounts voting for this witness (only available via REST) */
  voters_num?: number;
  /** Daily change in voter count (only available via REST) */
  voters_num_daily_change?: number;
  /** Current price feed value (only available via REST) */
  price_feed?: number;
  /** HBD interest rate in basis points (only available via REST) */
  hbd_interest_rate?: number;
  /** Last confirmed block number (only available via REST) */
  last_confirmed_block_num?: number;
}

export interface WitnessVoter {
  voter_name: string;
  vests: string;
  account_vests: string;
  proxied_vests: string;
  timestamp: string;
}

export interface WitnessVotersResponse {
  total_votes: number;
  total_pages: number;
  voters: WitnessVoter[];
}
