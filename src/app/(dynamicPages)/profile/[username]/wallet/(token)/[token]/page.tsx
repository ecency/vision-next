import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "../../../_helpers";
import { HiveEngineChart, HiveEngineTokenHistory } from "./_components";
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
  const isExternalToken = (Array.from(Object.values(EcencyWalletCurrency)) as string[]).includes(
    token.toUpperCase()
  );

  return (
    <>
      {!isExternalToken && <HiveEngineChart />}
      {isExternalToken && (
        <div className="bg-white rounded-xl mb-4">
          <div className="p-4 text-sm text-gray-600 dark:text-gray-400">Market</div>
          <div className="px-4 pb-4 h-[300px]">
            <TradingViewWidget symbol={token.toUpperCase()} />
          </div>
        </div>
      )}
      {!isExternalToken && <HiveEngineTokenHistory />}
    </>
  );
}
