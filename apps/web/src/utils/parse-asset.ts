import { SMTAsset } from "@hiveio/dhive";

export enum Symbol {
  HIVE = "HIVE",
  HBD = "HBD",
  VESTS = "VESTS",
  SPK = "SPK"
}

export enum NaiMap {
  "@@000000021" = "HIVE",
  "@@000000013" = "HBD",
  "@@000000037" = "VESTS"
}

export interface Asset {
  amount: number;
  symbol: Symbol;
}

export function parseAsset(sval?: string | number | SMTAsset | null): Asset {
  if (!sval) {
    return { amount: 0, symbol: Symbol.HIVE };
  }

  if (typeof sval === "string" || typeof sval === "number") {
    const sp = sval.toString().trim().split(" ");

    const amount = parseFloat(sp[0] ?? "0");
    const symbol = sp[1] && Symbol[sp[1] as keyof typeof Symbol];

    return {
      amount: Number.isFinite(amount) ? amount : 0,
      symbol: symbol ?? Symbol.HIVE
    };
  }

  const precision = sval.precision ?? 0;
  const amount = parseFloat(sval.amount?.toString() ?? "0") / Math.pow(10, precision);
  const symbol = sval.nai && NaiMap[sval.nai as keyof typeof NaiMap];

  return {
    amount: Number.isFinite(amount) ? amount : 0,
    symbol: symbol ?? Symbol.HIVE
  };
}
