"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { Button } from "@/features/ui";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Link from "next/link";
import { BuyWithHiveForm, BuyWithHiveSuccess } from "./_components";
import "./_page.scss";
import { useRef, useState } from "react";
import { MarketAsset } from "@/api/market-pair";
import { TransferAsset } from "@/features/shared/transfer";
import { EcencyAnalytics } from "@ecency/sdk";
import { useSignTransfer } from "@/api/mutations";
import { error } from "@/features/shared/feedback";
import { formatError } from "@/api/format-error";

export function BuyPointsPage() {
  const { activeUser } = useActiveAccount();

  const [step, setStep] = useState<"form" | "success">("form");
  const [amount, setAmount] = useState("0");
  const [asset, setAsset] = useState<string>(MarketAsset.HIVE);
  const [pointsAmount, setPointsAmount] = useState("0");

  const { mutateAsync: sign, isPending } = useSignTransfer(
    "transfer",
    asset as TransferAsset
  );
  const isSubmittingRef = useRef(false);
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    activeUser?.username,
    "perks-points-by-hive" as any
  );

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
            isPending={isPending}
            onSubmit={async (formAmount, formAsset, formPointsAmount) => {
              if (isSubmittingRef.current) return;
              isSubmittingRef.current = true;

              setAmount(formAmount);
              setAsset(formAsset);
              setPointsAmount(formPointsAmount);

              if (!activeUser) {
                isSubmittingRef.current = false;
                return;
              }

              try {
                await sign({
                  to: "esteem.app",
                  amount: formAmount,
                  memo: "points",
                  asset: formAsset as TransferAsset,
                });
                recordActivity().catch(() => {});
                setStep("success");
              } catch (e) {
                error(...formatError(e));
              } finally {
                isSubmittingRef.current = false;
              }
            }}
          />
        )}
        {step === "success" && <BuyWithHiveSuccess pointsAmount={pointsAmount} />}
      </div>
    </div>
  );
}
