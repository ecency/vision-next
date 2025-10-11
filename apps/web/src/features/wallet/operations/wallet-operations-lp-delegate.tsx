import { Button, FormControl } from "@/features/ui";
import { getAccountWalletAssetInfoQueryOptions, getSpkMarketsQueryOptions } from "@ecency/wallets";
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
import { WalletOperationCardWrapper } from "./wallet-operation-card-wrapper";

interface Props {
  data?: Record<string, any>;
  asset: string;
  username: string;
  showSubmit: boolean;
  onSubmit: (data: { to: string; amount: string; memo?: string | undefined; from: string }) => void;
}

export function WalletOperationsLpDelegate({ data, asset, username, onSubmit, showSubmit }: Props) {
  const [to, setTo] = useState<string>(data?.to ?? "");

  const { data: accountWallet } = useQuery(getAccountWalletAssetInfoQueryOptions(username, asset));
  const { data: markets } = useQuery(getSpkMarketsQueryOptions());

  const methods = useForm({
    resolver: yupResolver(
      yup.object({
        amount: yup
          .number()
          .required(i18next.t("validation.required"))
          .min(0.001)
          .max(accountWallet?.accountBalance ?? 0.001)
      })
    ),
    defaultValues: {
      amount: data?.amount ?? 0
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
        <WalletOperationCardWrapper
          label="to"
          asset={asset}
          onBalanceClick={(v) => methods.setValue("amount", v)}
          username={to}
          userContent={
            <div className="px-4">
              <FormControl type="select" value={to} onChange={(e: any) => setTo(e.target.value)}>
                {markets?.list.map((market) => (
                  <option value={market.name} key={market.name}>
                    {market.status} {market.name}
                  </option>
                ))}
              </FormControl>
            </div>
          }
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
            <WalletOperationAmountForm readonly={!showSubmit} showMemo={false} />
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
