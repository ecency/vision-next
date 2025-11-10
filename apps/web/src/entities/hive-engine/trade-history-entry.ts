export interface HiveEngineTradeHistoryEntry {
  _id: number;
  type: "buy" | "sell";
  buyer: string;
  seller: string;
  symbol: string;
  quantity: string;
  price: string;
  timestamp: number;
  volume: string;
  buyTxId: string;
  sellTxId: string;
}
