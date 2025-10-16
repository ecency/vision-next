import { Button } from "@/features/ui";
import { AssetOperation, getAccountWalletAssetInfoQueryOptions } from "@ecency/wallets";
import { yupResolver } from "@hookform/resolvers/yup";
import { useQuery } from "@tanstack/react-query";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { WalletOperationCard } from "./wallet-opearation-card";
import { WalletOperationAmountForm } from "./wallet-operation-amount-form";
import { formatNumber } from "@/utils";

interface Props {
  to?: string;
  data?: Record<string, any>;
  asset: string;
  username: string;
  showSubmit: boolean;
  showMemo?: boolean;
  operation: AssetOperation;
  onSubmit: (data: { to: string; amount: string; memo?: string | undefined; from: string }) => void;
}

export function WalletOperationsTransfer({
  data,
  to: toProp,
  asset,
  username,
  operation,
  onSubmit,
  showSubmit,
  showMemo = false
}: Props) {
  const shouldDefaultToSelf = useMemo(
    () =>
      [
        AssetOperation.Stake,
        AssetOperation.Unstake,
        AssetOperation.WithdrawFromSavings,
        AssetOperation.ClaimInterest,
      ].includes(operation),
    [operation]
  );

  const [to, setTo] = useState<string>(
    data?.to ?? toProp ?? (shouldDefaultToSelf ? username : "")
  );

  const { data: accountWallet } = useQuery(getAccountWalletAssetInfoQueryOptions(username, asset));

  useEffect(() => {
    if (data?.to) {
      setTo(data.to);
      return;
    }

    if (toProp) {
      setTo(toProp);
      return;
    }

    if (shouldDefaultToSelf) {
      setTo(username);
    }
  }, [data?.to, operation, shouldDefaultToSelf, toProp, username]);

  const isEngineToken = accountWallet?.layer === "ENGINE";
  const liquidBalance = useMemo(
    () =>
      Number(accountWallet?.parts?.find((part) => part.name === "liquid")?.balance ?? 0),
    [accountWallet?.parts]
  );
  const stakedBalance = useMemo(
    () =>
      Number(accountWallet?.parts?.find((part) => part.name === "staked")?.balance ?? 0),
    [accountWallet?.parts]
  );
  const savingsBalance = useMemo(
    () =>
      Number(accountWallet?.parts?.find((part) => part.name === "savings")?.balance ?? 0),
    [accountWallet?.parts]
  );

  const operationBalance = useMemo(() => {
    if (!accountWallet) {
      return undefined;
    }

    if (!isEngineToken) {
      if (
        [AssetOperation.WithdrawFromSavings, AssetOperation.ClaimInterest].includes(
          operation
        )
      ) {
        return savingsBalance;
      }

      return accountWallet.accountBalance ?? 0;
    }

    if ([AssetOperation.Transfer, AssetOperation.Stake].includes(operation)) {
      return liquidBalance;
    }

    if (
      [AssetOperation.Unstake, AssetOperation.Delegate, AssetOperation.Undelegate].includes(
        operation
      )
    ) {
      return stakedBalance;
    }

    return accountWallet.accountBalance ?? 0;
  }, [
    accountWallet,
    isEngineToken,
    liquidBalance,
    operation,
    savingsBalance,
    stakedBalance,
  ]);

  const maxAmount = operationBalance ?? 0;

  const validationMax = maxAmount || 0.001;

  const recipientBalance = useMemo(() => {
    if (!accountWallet || !isEngineToken) {
      return undefined;
    }

    if (to !== username) {
      return undefined;
    }

    if ([AssetOperation.Stake, AssetOperation.Unstake].includes(operation)) {
      return stakedBalance;
    }

    return undefined;
  }, [accountWallet, isEngineToken, operation, stakedBalance, to, username]);

  const methods = useForm({
    resolver: yupResolver(
      yup.object({
        amount: yup
          .number()
          .required(i18next.t("validation.required"))
          .min(0.001)
          .max(validationMax),
        memo: yup.string()
      })
    ),
    defaultValues: {
      amount:
        data?.amount ??
        (operation === AssetOperation.ClaimInterest ? 0.001 : 0),
      memo: data?.memo ?? ""
    }
  });

  return (
    <div className="grid">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <WalletOperationCard
          label="from"
          asset={asset}
          balance={operationBalance}
          username={username}
          onBalanceClick={() =>
            methods.setValue("amount", +formatNumber(maxAmount || 0, 3) || 0)
          }
        />
        <WalletOperationCard
          label="to"
          asset={asset}
          balance={recipientBalance}
          username={to ?? ""}
          onUsernameSubmit={(v) => setTo(v ?? "")}
          editable={
            showSubmit &&
            ![AssetOperation.Unstake, AssetOperation.ClaimInterest].includes(operation)
          }
          onBalanceClick={() =>
            methods.setValue("amount", +formatNumber(maxAmount || 0, 3) || 0)
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
              <Button
                type="submit"
                disabled={!to || maxAmount <= 0}
                icon={<UilArrowRight />}
              >
                {i18next.t("g.continue")}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
