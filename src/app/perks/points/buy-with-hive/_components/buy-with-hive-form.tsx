import { MarketAsset } from "@/api/market-pair";
import { DEFAULT_DYNAMIC_PROPS, getDynamicPropsQuery } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { SwapAmountControl } from "@/features/market/market-swap-form/swap-amount-control";
import { Button } from "@/features/ui";
import { HiveWallet } from "@/utils";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useMemo, useState } from "react";

interface Props {
  onSubmit: (amount: string, asset: string, pointsAmount: string) => void;
}

export function BuyWithHiveForm({ onSubmit }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();

  const [amount, setAmount] = useState("0");
  const [asset, setAsset] = useState(MarketAsset.HIVE);

  const w = useMemo(
    () =>
      activeUser
        ? new HiveWallet(activeUser?.data, dynamicProps ?? DEFAULT_DYNAMIC_PROPS)
        : ({ balance: 0 } as HiveWallet),
    [activeUser, dynamicProps]
  );
  const usdRate = useMemo(() => {
    if (asset === MarketAsset.HIVE) {
      return dynamicProps ? dynamicProps.base / dynamicProps.quote : 0;
    } else if (asset === MarketAsset.HBD) {
      return 1;
    }

    return 0;
  }, [asset, w, dynamicProps]);
  const balance = useMemo(() => {
    if (asset === MarketAsset.HIVE) {
      return w.balance.toFixed(2) + " HIVE";
    } else if (asset === MarketAsset.HBD) {
      return w.hbdBalance.toFixed(2) + " HBD";
    }

    return "0";
  }, [w, asset]);
  const isAmountMoreThanBalance = useMemo(() => balance < amount, [amount, balance]);
  const pointsAmount = useMemo(() => ((+amount * usdRate) / 0.002).toFixed(2), [amount, usdRate]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_min-content_1fr] items-center gap-4 mt-4 md:mt-6 lg:mt-8">
        <SwapAmountControl
          value={amount}
          setValue={(e) => setAmount(e)}
          labelKey={"market.from"}
          asset={asset}
          availableAssets={[MarketAsset.HBD, MarketAsset.HIVE]}
          setAsset={setAsset}
          usdRate={usdRate}
          disabled={false}
          balance={balance}
          showBalance={true}
        />
        <div className="flex justify-center items-center">
          <div className=" text-blue-dark-sky p-2">
            <UilArrowRight />
          </div>
        </div>
        <SwapAmountControl
          value={pointsAmount}
          setValue={(e) => {}}
          labelKey={"market.to"}
          asset={"POINTS" as MarketAsset}
          availableAssets={["POINTS" as MarketAsset]}
          setAsset={() => {}}
          usdRate={0.002}
          disabled={true}
        />
      </div>
      <div>
        {isAmountMoreThanBalance && (
          <small className="usd-balance bold block text-red mt-3">
            {i18next.t("market.more-than-balance")}
          </small>
        )}
      </div>

      <div className="flex justify-end mt-4 md:mt-6 lg:mt-8">
        <Button
          icon={<UilArrowRight />}
          disabled={!amount || amount === "0" || isAmountMoreThanBalance}
          onClick={() => onSubmit(amount, asset, pointsAmount)}
        >
          {i18next.t("g.continue")}
        </Button>
      </div>
    </>
  );
}
