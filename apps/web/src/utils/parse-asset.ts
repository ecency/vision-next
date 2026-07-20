import type { SMTAsset } from "@ecency/sdk";

export enum Symbol {
  HIVE = "HIVE",
  HBD = "HBD",
  VESTS = "VESTS"
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
    const symbol = sp[1] ? Symbol[sp[1] as keyof typeof Symbol] : undefined;

    return {
      amount: Number.isFinite(amount) ? amount : 0,
      symbol: symbol ?? Symbol.HIVE
    };
  }

  const precision = sval.precision ?? 0;
  const amount = parseFloat(sval.amount?.toString() ?? "0") / Math.pow(10, precision);
  // NaiMap members mirror the Symbol members by value, but TS keeps the two enums
  // unrelated, so the lookup result has to be re-typed. An unknown nai yields undefined.
  const symbol = sval.nai
    ? (NaiMap[sval.nai as keyof typeof NaiMap] as unknown as Symbol | undefined)
    : undefined;

  return {
    amount: Number.isFinite(amount) ? amount : 0,
    symbol: symbol ?? Symbol.HIVE
  };
}
