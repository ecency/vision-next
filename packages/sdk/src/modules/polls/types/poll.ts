export const POLLS_PROTOCOL_VERSION = 1.1;

export enum PollPreferredInterpretation {
  NUMBER_OF_VOTES = "number_of_votes",
  TOKENS = "tokens",
}

export interface PollChoiceVotes {
  total_votes: number;
  hive_hp?: number;
  hive_proxied_hp?: number;
  hive_hp_incl_proxied: number | null;
}

export interface PollChoice {
  choice_num: number;
  choice_text: string;
  votes?: PollChoiceVotes;
}

export interface PollVoter {
  name: string;
  choices: number[];
  hive_hp?: number;
  hive_proxied_hp?: number;
  hive_hp_incl_proxied?: number;
}

export interface PollStats {
  total_voting_accounts_num: number;
  total_hive_hp?: number;
  total_hive_proxied_hp?: number;
  total_hive_hp_incl_proxied: number | null;
}

export interface Poll {
  author: string;
  permlink: string;
  question: string;
  poll_choices: PollChoice[];
  poll_voters?: PollVoter[];
  poll_stats?: PollStats;
  poll_trx_id: string;
  status: string;
  end_time: string;
  preferred_interpretation: PollPreferredInterpretation | string;
  max_choices_voted: number;
  filter_account_age_days: number;
  protocol_version: number;
  created: string;
  post_title: string;
  post_body: string;
  parent_permlink: string;
  tags: string[];
  image: unknown[];
  token?: string | null;
  community_membership?: string[];
  allow_vote_changes?: boolean;
  ui_hide_res_until_voted?: boolean;
  platform?: string;
}

export function mapMetaChoicesToPollChoices(metaChoices: string[]): PollChoice[] {
  if (!metaChoices) {
    return [];
  }

  return metaChoices.map((choice, index) => ({
    choice_num: index + 1,
    choice_text: choice,
    votes: {
      total_votes: 0,
      hive_hp: 0,
      hive_proxied_hp: 0,
      hive_hp_incl_proxied: 0,
    },
  }));
}
