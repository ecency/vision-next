import { Button } from "@/features/ui";
import { getAccountWalletAssetInfoQueryOptions } from "@ecency/wallets";
import { yupResolver } from "@hookform/resolvers/yup";
import { useQuery } from "@tanstack/react-query";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { WalletOperationCard } from "./wallet-opearation-card";
import { WalletOperationAmountForm } from "./wallet-operation-amount-form";
import { formatNumber } from "@/utils";

interface Props {
  data?: Record<string, any>;
  asset: string;
  username: string;
  showSubmit: boolean;
  showMemo?: boolean;
  onSubmit: (data: { to: string; amount: string; memo?: string | undefined; from: string }) => void;
}

export function WalletOperationsTransfer({
  data,
  asset,
  username,
  onSubmit,
  showSubmit,
  showMemo = false
}: Props) {
  const [to, setTo] = useState<string>(data?.to ?? "");

  const { data: accountWallet } = useQuery(getAccountWalletAssetInfoQueryOptions(username, asset));

  const methods = useForm({
    resolver: yupResolver(
      yup.object({
        amount: yup
          .number()
          .required(i18next.t("validation.required"))
          .min(0.001)
          .max(accountWallet?.accountBalance ?? 0.001),
        memo: yup.string()
      })
    ),
    defaultValues: {
      amount: data?.amount ?? 0,
      memo: data?.memo ?? ""
    }
  });

  return (
    <div className="grid">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <WalletOperationCard
          label="from"
          asset={asset}
          username={username}
          onBalanceClick={(v) => methods.setValue("amount", v)}
        />
        <WalletOperationCard
          label="to"
          asset={asset}
          username={to ?? ""}
          onUsernameSubmit={(v) => setTo(v ?? "")}
          editable={showSubmit}
          onBalanceClick={(v) => methods.setValue("amount", v)}
        />
      </div>

      <FormProvider {...methods}>
        <form
          className="block"
          onSubmit={methods.handleSubmit((data) =>
            onSubmit({
              ...data,
              amount: `${formatNumber(data.amount, 3)} ${asset}`,
              from: username,
              to
            })
          )}
        >
          <div className="border-y border-[--border-color] flex flex-col py-4 gap-4 font-mono">
            <WalletOperationAmountForm readonly={!showSubmit} showMemo={showMemo} />
          </div>

          <div className="flex justify-between items-center p-4">
            <div className="flex flex-col text-sm">
              <div className="uppercase text-xs font-semibold text-gray-600 dark:text-gray-400">
                fee
              </div>
              <div className="text-black dark:text-white font-semibold">0.0%</div>
            </div>
            {showSubmit && (
              <Button type="submit" disabled={!to} icon={<UilArrowRight />}>
                {i18next.t("g.continue")}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
