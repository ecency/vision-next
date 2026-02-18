export interface HiveEngineMarketResponse {
  _id: number;
  symbol: string;
  volume: string;
  volumeExpiration: number;
  lastPrice: string;
  lowestAsk: string;
  highestBid: string;
  lastDayPrice: string;
  lastDayPriceExpiration: number;
  priceChangeHive: string;
  priceChangePercent: string;
}
