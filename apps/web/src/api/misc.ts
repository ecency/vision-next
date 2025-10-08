import defaults from "@/defaults.json";
import { appAxios } from "@/api/axios";

export const uploadImage = async (
  file: File,
  token: string
): Promise<{
  url: string;
}> => {
  const fData = new FormData();
  fData.append("file", file);

  const postUrl = `${defaults.imageServer}/hs/${token}`;

  return appAxios
    .post(postUrl, fData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
      timeout: Infinity
    })
    .then((r) => r.data);
};

export const getMarketData = (
  coin: string,
  vsCurrency: string,
  fromTs: string,
  toTs: string
): Promise<{ prices?: [number, number] }> => {
  const u = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart/range?vs_currency=${vsCurrency}&from=${fromTs}&to=${toTs}`;
  return appAxios.get(u).then((r) => r.data);
};

export const getCurrencyRate = (cur: string): Promise<number> => {
  if (cur === "hbd") {
    return new Promise((resolve) => resolve(1));
  }

  const u = `https://api.coingecko.com/api/v3/simple/price?ids=hive_dollar&vs_currencies=${cur}`;
  return appAxios
    .get(u)
    .then((r) => r.data)
    .then((r) => r.hive_dollar[cur]);
};
