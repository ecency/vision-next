export interface ApiResponse<T> {
  status: number;
  data: T;
}

export interface CurrencyRates {
  [currency: string]: {
    quotes: {
      [currency: string]: {
        last_updated: string;
        percent_change: number;
        price: number;
      };
    };
  };
}
