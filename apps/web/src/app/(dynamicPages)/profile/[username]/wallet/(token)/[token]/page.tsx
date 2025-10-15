import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "../../../_helpers";
import { HiveEngineChart, HiveEngineTokenHistory } from "./_components";
import { normalizeTokenSymbol, isSpkLayerTokenSymbol } from "./_helpers/token-symbol";
import { TradingViewWidget } from "@/features/trading-view";
import { EcencyWalletCurrency } from "@ecency/wallets";

interface Props {
  params: Promise<{ username: string; token: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace("%40", ""), "wallet");
}

export default async function TokenPage({ params }: Props) {
  const token = (await params).token as string;
  const tokenSymbol = normalizeTokenSymbol(token);
  const isSpkLayerToken = isSpkLayerTokenSymbol(tokenSymbol);
  const isExternalToken = (Array.from(Object.values(EcencyWalletCurrency)) as string[]).includes(
    tokenSymbol
  );

  return (
    <>
      {!isExternalToken && !isSpkLayerToken && <HiveEngineChart />}
      {isExternalToken && !isSpkLayerToken && (
        <div className="bg-white rounded-xl mb-4">
          <div className="p-4 text-sm text-gray-600 dark:text-gray-400">Market</div>
          <div className="px-4 pb-4 h-[300px]">
            <TradingViewWidget symbol={tokenSymbol} />
          </div>
        </div>
      )}
      {!isExternalToken && <HiveEngineTokenHistory />}
    </>
  );
}
