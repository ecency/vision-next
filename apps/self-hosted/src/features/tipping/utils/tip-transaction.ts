import { broadcast } from "@/features/auth";
import { getQueryClient } from "@ecency/sdk";
import { getAccountWalletAssetInfoQueryOptions } from "@ecency/wallets";
import type { Operation } from "@hiveio/dhive";
import type { TippingAsset } from "../types";

const ASSETS_WITH_USD_PRICE: TippingAsset[] = ["HIVE", "HBD"];
export interface ExecuteTipParams {
  from: string;
  to: string;
  amount: string;
  asset: TippingAsset;
  memo: string;
}

/**
 * Execute tip: transfer HIVE, HBD, or POINTS.
 * Uses current auth (keychain or hivesigner) to broadcast.
 * Fetches token price in USD via getTokenPriceQueryOptions for conversion.
 */
export async function executeTip(params: ExecuteTipParams): Promise<void> {
  const { from, to, amount, asset, memo } = params;

  let realAmount = 0;
  const num = parseFloat(amount);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error("Invalid amount");
  }
  const formatted = num.toFixed(3);

  // Ensure USD price is loaded for supported assets (conversion relative to USD)
  const queryClient = getQueryClient();

  const info = await queryClient.ensureQueryData(
    getAccountWalletAssetInfoQueryOptions(to, asset),
  );
  realAmount = num / (info?.price ?? 0);

  let operations: Operation[];

  if (asset === "HIVE") {
    operations = [
      [
        "transfer",
        {
          from,
          to,
          amount: `${realAmount} HIVE`,
          memo,
        },
      ],
    ];
  } else if (asset === "HBD") {
    operations = [
      [
        "transfer",
        {
          from,
          to,
          amount: `${realAmount} HBD`,
          memo,
        },
      ],
    ];
  } else if (asset === "POINTS") {
    operations = [
      [
        "custom_json",
        {
          id: "ecency_point_transfer",
          json: JSON.stringify({
            sender: from,
            receiver: to,
            amount: `${realAmount} POINT`,
            memo,
          }),
          required_auths: [from],
          required_posting_auths: [],
        },
      ],
    ];
  } else {
    throw new Error(`Unsupported asset: ${asset}`);
  }

  await broadcast(operations, { authorityType: "Active" });
}
