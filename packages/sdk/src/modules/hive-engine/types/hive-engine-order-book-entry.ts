export interface HiveEngineOrderBookEntry {
  _id: number;
  txId: string;
  timestamp: number;
  account: string;
  symbol: string;
  quantity: string;
  price: string;
  expiration: number;
  tokensLocked?: string;
}
