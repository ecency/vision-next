export interface SpkApiWallet {
  balance: number;
  claim: number;
  drop: {
    availible: {
      amount: number;
      precision: number;
      token: string;
    };
    last_claim: number;
    total_claims: number;
  };
  poweredUp: number;
  granted: {
    t: number;
    [key: string]: number;
  };
  granting: {
    t: number;
    [key: string]: number;
  };
  heldCollateral: number;
  contracts: unknown[];
  up: unknown;
  down: unknown;
  power_downs: { [key: string]: string };
  gov_downs: unknown;
  gov: number;
  spk: number;
  spk_block: number;
  tick: string; // double in string
  node: string;
  head_block: number;
  behind: number;
  VERSION: string; // v<x.x.x>
  pow: number;
}

export interface SpkMarkets {
  head_block: number;
  markets: {
    node: {
      [key: string]: {
        lastGood: number;
        report: {
          block: number;
        };
      };
    };
  };
  stats: any;
}

export interface TransformedSpkMarkets {
  list: { name: string; status: string }[];
  raw: SpkMarkets;
}
