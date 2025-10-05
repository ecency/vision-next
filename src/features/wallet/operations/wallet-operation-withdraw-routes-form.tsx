import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InferType } from "yup";
import i18next from "i18next";
import { Button, FormControl } from "@/features/ui";
import { motion } from "framer-motion";
import { withdrawVestingRouteHive } from "@/features/wallet/sdk";
import { useClientActiveUser } from "@/api/queries";

// Define schema outside the component to prevent recreation on each render
const schema = yup.object({
  account: yup.string().required(i18next.t("withdraw-routes.validation-account")).min(3).max(20),
  percent: yup.number().required(i18next.t("withdraw-routes.validation-percent")).min(0).max(100),
  auto: yup.string().required()
});

export type WithdrawRoutesFormData = InferType<typeof schema>;

interface Props {
  onSubmit: (data: Omit<Parameters<typeof withdrawVestingRouteHive>[0], "type">) => void;
  initialValues?: Partial<WithdrawRoutesFormData>;
}

export function WalletOperationWithdrawRoutesForm({ onSubmit, initialValues }: Props) {
  const activeUser = useClientActiveUser();
  const methods = useForm<WithdrawRoutesFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      account: initialValues?.account || "",
      percent: initialValues?.percent || 10,
      auto: initialValues?.auto || "yes"
    }
  });

  return (
    <FormProvider {...methods}>
      <form
        className="border-b border-[--border-color] p-4 items-end grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        onSubmit={methods.handleSubmit((data) =>
          onSubmit({
            from_account: activeUser!.username,
            to_account: data.account,
            auto_vest: data.auto === "yes",
            percent: data.percent
          })
        )}
      >
        <div className="lg:col-span-3">
          <label>{i18next.t("withdraw-routes.account")}</label>
          <FormControl
            {...methods.register("account")}
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            aria-invalid={!!methods.formState.errors.account}
          />
          {methods.formState.errors.account && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red text-xs px-3 pt-0.5"
            >
              {methods.formState.errors.account.message}
            </motion.div>
          )}
        </div>
        <div>
          <label>{i18next.t("withdraw-routes.percent")}</label>
          <FormControl
            {...methods.register("percent", { valueAsNumber: true })}
            type="number"
            aria-invalid={!!methods.formState.errors.percent}
          />
          {methods.formState.errors.percent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red text-xs px-3 pt-0.5"
            >
              {methods.formState.errors.percent.message}
            </motion.div>
          )}
        </div>
        <div>
          <label>{i18next.t("withdraw-routes.auto-power-up")}</label>
          <FormControl {...methods.register("auto")} type="select">
            <option value="yes">{i18next.t("g.yes")}</option>
            <option value="no">{i18next.t("g.no")}</option>
          </FormControl>
        </div>
        <Button appearance="gray" size="lg" full={true} type="submit">
          {i18next.t("g.add")}
        </Button>
      </form>
    </FormProvider>
  );
}
