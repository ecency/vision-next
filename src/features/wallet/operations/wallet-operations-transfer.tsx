import { Button } from "@/features/ui";
import { yupResolver } from "@hookform/resolvers/yup";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { WalletOperationCard } from "./wallet-opearation-card";
import { WalletOperationAmountForm } from "./wallet-operation-amount-form";

interface Props {
  asset: string;
  username: string;
}

const form = yup.object({
  amount: yup.number().required(i18next.t("validation.required")).min(0.001),
  memo: yup.string()
});

export function WalletOperationsTransfer({ asset, username }: Props) {
  const [mode, setMode] = useState("");
  const [to, setTo] = useState<string>();

  const methods = useForm({
    resolver: yupResolver(form),
    defaultValues: {
      amount: 0,
      memo: ""
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
          onUsernameSubmit={(v) => setTo(v)}
          editable={true}
        />
      </div>

      <FormProvider {...methods}>
        <form className="block" onSubmit={methods.handleSubmit(() => {})}>
          <div className="border-y border-[--border-color] flex flex-col py-4 gap-4 font-mono">
            <WalletOperationAmountForm username={username} asset={asset} />
          </div>

          <div className="flex justify-between items-center p-4">
            <div className="flex flex-col text-sm">
              <div className="uppercase text-xs font-semibold text-gray-600 dark:text-gray-400">
                fee
              </div>
              <div className="text-black dark:text-white font-semibold">0.0%</div>
            </div>
            <Button type="submit" disabled={!to} icon={<UilArrowRight />}>
              {i18next.t("g.continue")}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
