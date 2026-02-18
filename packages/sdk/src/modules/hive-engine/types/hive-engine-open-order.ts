export interface HiveEngineOpenOrder {
  id: string;
  type: "buy" | "sell";
  account: string;
  symbol: string;
  quantity: string;
  price: string;
  total: string;
  timestamp: number;
}
