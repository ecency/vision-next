export type TippingVariant = "post" | "general";

export type TippingAsset = "HIVE" | "HBD" | "POINTS";

/** Assets that require active key input for tipping */
export const ASSETS_REQUIRING_KEY = ["POINTS", "HIVE", "HBD", "HP"] as const;

/** External wallet symbols (show QR with address, no Tip button) */
export const EXTERNAL_WALLET_SYMBOLS = [
  "APT",
  "BNB",
  "BTC",
  "ETH",
  "SOL",
  "TON",
  "TRX",
] as const;

export function isAssetRequiringKey(asset: string): boolean {
  return ASSETS_REQUIRING_KEY.includes(
    asset as (typeof ASSETS_REQUIRING_KEY)[number],
  );
}

export function isExternalWalletAsset(asset: string): boolean {
  return EXTERNAL_WALLET_SYMBOLS.includes(
    asset as (typeof EXTERNAL_WALLET_SYMBOLS)[number],
  );
}

export interface TippingConfig {
  enabled: boolean;
  buttonLabel: string;
  presetAmounts: number[];
}
