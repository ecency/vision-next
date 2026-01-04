export interface PostTip {
  sender: string;
  receiver: string;
  amount: number;
  currency: string;
  memo: string;
  source: string;
  timestamp: string;
}

export interface PostTipsResponse {
  meta: {
    count: number;
    totals: Record<string, number>;
  };
  list: PostTip[];
}
