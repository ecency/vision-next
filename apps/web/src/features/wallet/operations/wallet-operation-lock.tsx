import { Button, FormControl } from "@/features/ui";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { WalletOperationCard } from "./wallet-opearation-card";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useQuery } from "@tanstack/react-query";
import { getAccountWalletAssetInfoQueryOptions } from "@ecency/sdk";
import { motion } from "framer-motion";

interface Props {
  asset: string;
  username: string;
  showSubmit: boolean;
  showMemo?: boolean;
  onSubmit: () => void;
  data?: Record<string, any>;
}

export function WalletOperationLock({ username, asset, onSubmit, showSubmit, data }: Props) {
  const { data: accountWallet } = useQuery(getAccountWalletAssetInfoQueryOptions(username, asset));

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

  const amountError = methods.formState.errors.amount?.message?.toString();

  return (
    <form className="grid gap-4" onSubmit={methods.handleSubmit(onSubmit)}>
      <div>
        <WalletOperationCard label="from" asset={asset} username={username} />
      </div>

      <div className="border-t border-[--border-color] p-4">
        <div className="uppercase text-xs pb-2 font-semibold text-gray-600 dark:text-gray-400">
          amount
        </div>

        <FormControl
          {...methods.register("amount")}
          type="number"
          step={0.001}
          readOnly={!showSubmit}
          placeholder="0.01"
          aria-invalid={!!amountError}
        />
        {amountError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            key={amountError}
            className="text-red text-xs px-3 pt-0.5"
          >
            {amountError}
          </motion.div>
        )}
      </div>

      <div className="flex border-t border-[--border-color] justify-between items-center p-4">
        <div className="flex flex-col text-sm">
          <div className="uppercase text-xs font-semibold text-gray-600 dark:text-gray-400">
            fee
          </div>
          <div className="text-black dark:text-white font-semibold">0.0%</div>
        </div>

        {showSubmit && (
          <Button type="submit" icon={<UilArrowRight />} onClick={onSubmit}>
            {i18next.t("g.continue")}
          </Button>
        )}
      </div>
    </form>
  );
}
