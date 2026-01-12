export interface DraftMetadata {
  beneficiaries?: Array<{ account: string; weight: number }>;
  rewardType?: string;
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
