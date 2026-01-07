import { CONFIG, getBoundFetch } from "@/modules/core";
import { MarketData } from "./types";
import { CurrencyRates } from "@/modules/private-api/types";

type RequestError = Error & { status?: number; data?: unknown };

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T;
  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`) as RequestError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function getMarketData(
  coin: string,
  vsCurrency: string,
  fromTs: string,
  toTs: string
): Promise<MarketData> {
  const fetchApi = getBoundFetch();
  const url = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart/range?vs_currency=${vsCurrency}&from=${fromTs}&to=${toTs}`;
  const response = await fetchApi(url);
  return parseJsonResponse<MarketData>(response);
}

export async function getCurrencyRate(cur: string): Promise<number> {
  if (cur === "hbd") {
    return 1;
  }

  const fetchApi = getBoundFetch();
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=hive_dollar&vs_currencies=${cur}`;
  const response = await fetchApi(url);
  const data = await parseJsonResponse<{ hive_dollar: Record<string, number> }>(response);
  return data.hive_dollar[cur];
}

export async function getCurrencyTokenRate(currency: string, token: string): Promise<number> {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(
    CONFIG.privateApiHost +
      `/private-api/market-data/${currency === "hbd" ? "usd" : currency}/${token}`
  );

  return parseJsonResponse<number>(response);
}

export async function getCurrencyRates(): Promise<CurrencyRates> {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/market-data/latest");
  return parseJsonResponse<CurrencyRates>(response);
}
