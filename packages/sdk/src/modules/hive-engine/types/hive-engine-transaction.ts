export interface HiveEngineTransaction {
  _id: string;
  blockNumber: number;
  transactionId: string;
  timestamp: number;
  operation: string;
  from: string;
  to: string;
  symbol: string;
  quantity: string;
  memo: any;
  account: string;
  authorperm?: string;
}
