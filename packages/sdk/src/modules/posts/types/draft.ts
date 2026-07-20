import { WrappedResponse } from "@/modules/core/types";

// The three payout options a draft can carry: default 50/50, "sp" full power-up,
// "dp" declined payout. The drafts API only ever emits these.
export type DraftRewardType = "default" | "sp" | "dp";

export interface DraftMetadata {
  beneficiaries?: Array<{ account: string; weight: number }>;
  rewardType?: DraftRewardType;
  videos?: Record<string, any>;
  poll?: any;
  [key: string]: any;
}

export interface Draft {
  body: string;
  created: string;
  modified: string;
  post_type: string;
  tags_arr: string[];
  tags: string;
  timestamp: number;
  title: string;
  _id: string;
  meta?: DraftMetadata;
}

export type DraftsWrappedResponse = WrappedResponse<Draft>;
