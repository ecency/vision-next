"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { Button } from "@/features/ui";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Link from "next/link";
import { BuyWithHiveForm, BuyWithHiveSuccess } from "./_components";
import "./_page.scss";
import { useCallback, useState } from "react";
import { MarketAsset } from "@/api/market-pair";
import { KeyOrHot, TransferAsset } from "@/features/shared";
import { EcencyAnalytics, useSignOperationByHivesigner } from "@ecency/sdk";
import { useSignTransferByKey, useSignTransferByKeychain } from "@/api/mutations";
import { PrivateKey } from "@hiveio/dhive";

export function BuyPointsPage() {
  const { activeUser } = useActiveAccount();

  const [step, setStep] = useState<"form" | "sign" | "success">("form");
  const [amount, setAmount] = useState("0");
  const [asset, setAsset] = useState<string>(MarketAsset.HIVE);
  const [pointsAmount, setPointsAmount] = useState("0");

  const { mutateAsync: transfer, isPending: isApiPending } = useSignTransferByKey(
    "transfer",
    asset as TransferAsset
  );
  const { mutateAsync: transferByKeychain, isPending: isKeychainPending } =
    useSignTransferByKeychain("transfer", asset as TransferAsset);
  const { mutateAsync: transferByHivesigner } = useSignOperationByHivesigner("/perks/points");
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    activeUser?.username,
    "perks-points-by-hive" as any
  );

  const onKey = useCallback(
    async (key: PrivateKey) => {
      if (!activeUser) {
        return;
      }

      await transfer({
        username: activeUser.username,
        key,
        to: "esteem.app",
        fullAmount: `${(+amount).toFixed(3)} ${asset}`,
        memo: "points",
        amount
      });
      recordActivity();
      setStep("success");
    },
    [activeUser, amount, asset]
  );

  const onKeychain = useCallback(async () => {
    if (!activeUser) {
      return;
    }

    await transferByKeychain({
      username: activeUser.username,
      to: "esteem.app",
      fullAmount: `${(+amount).toFixed(3)} ${asset}`,
      memo: "points",
      amount
    });
    recordActivity();
    setStep("success");
  }, [activeUser, amount, asset]);

  return (
    <div className="buy-points-page grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
      <div className="sm:col-span-2 lg:col-span-3 p-2 md:p-4 lg:p-6 bg-white rounded-xl w-full flex flex-col">
        <Link href="/perks/points">
          <Button
            size="sm"
            appearance="gray-link"
            icon={<UilArrowLeft />}
            iconPlacement="left"
            noPadding={true}
          >
            {i18next.t("g.back")}
          </Button>
        </Link>
        <h1 className="font-bold text-xl mt-2 md:mt-4 lg:mt-6">
          {i18next.t("perks.points-buy-hive-title")}
        </h1>
        <h2 className="opacity-50 mb-4">{i18next.t("perks.points-buy-hive-description")}</h2>

        {step === "form" && (
          <BuyWithHiveForm
            onSubmit={(amount, asset, pointsAmount) => {
              setAmount(amount);
              setAsset(asset);
              setPointsAmount(pointsAmount);
              setStep("sign");
            }}
          />
        )}
        {step === "sign" && (
          <div>
            <KeyOrHot
              inProgress={isKeychainPending || isApiPending}
              onKey={onKey}
              onHot={() =>
                transferByHivesigner({
                  operation: [
                    "transfer",
                    {
                      from: activeUser?.username,
                      to: "esteem.app",
                      amount: `${amount} ${asset}`,
                      memo: "points"
                    }
                  ]
                })
              }
              onKc={onKeychain}
            />
          </div>
        )}
        {step === "success" && <BuyWithHiveSuccess pointsAmount={pointsAmount} />}
      </div>
    </div>
  );
}
