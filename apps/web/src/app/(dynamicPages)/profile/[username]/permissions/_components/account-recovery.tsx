"use client";

import { formatError } from "@/api/operations";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, KeyOrHot, success } from "@/features/shared";
import {
  getAccountFullQueryOptions,
  getAccountPendingRecoveryQueryOptions,
  getAccountRecoveriesQueryOptions,
  useAccountUpdateRecovery
} from "@ecency/sdk";
import { PrivateKey } from "@hiveio/dhive";
import { yupResolver } from "@hookform/resolvers/yup";
import { useQuery } from "@tanstack/react-query";
import { UilEditAlt } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { FormControl, InputGroup } from "@ui/input";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { getAccessToken, getSdkAuthContext } from "@/utils";

const ECENCY = "ecency";

const schema = yup.object({
  isEcency: yup.boolean().optional(),
  newRecoveryAccount: yup
    .string()
    .required(i18next.t("validation.required"))
    .min(2, i18next.t("sign-up.username-max-length-error")),
  recoveryEmail: yup.string().when("isEcency", {
    is: true,
    then: (s) =>
      s.required(i18next.t("validation.required")).email(i18next.t("validation.invalid-email")),
    otherwise: (s) => s.optional()
  })
});

export function AccountRecovery() {
  const { activeUser } = useActiveAccount();

  const { data } = useQuery(getAccountFullQueryOptions(activeUser?.username));
  const { data: recoveries } = useQuery(
    getAccountRecoveriesQueryOptions(
      activeUser?.username,
      getAccessToken(activeUser?.username ?? "")
    )
  );
  const { data: pendingRecovery } = useQuery(
    getAccountPendingRecoveryQueryOptions(activeUser?.username)
  );
  const [formInitiated, setFormInitiated] = useState(false);
  const [keyDialog, setKeyDialog] = useState(false);

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      newRecoveryAccount: "",
      recoveryEmail: "",
      isEcency: false
    },
    mode: "onChange"
  });
  const newRecoveryAccount = methods.watch("newRecoveryAccount");

  const { mutateAsync: updateRecovery, isPending } = useAccountUpdateRecovery(
    activeUser?.username,
    getAccessToken(activeUser?.username ?? ""),
    {
      onError: (e) => error(...formatError(e)),
      onSuccess: () => success(i18next.t("account-recovery.success-message"))
    },
    getSdkAuthContext(activeUser, activeUser?.username)
  );

  const update = useCallback(() => setKeyDialog(true), []);
  const handleSign = useCallback(
    async (type: Parameters<typeof updateRecovery>[0]["type"], key?: PrivateKey) => {
      const { isEcency, newRecoveryAccount } = methods.getValues();
      if (isEcency || newRecoveryAccount === ECENCY) {
        await updateRecovery({
          type: "ecency",
          email: methods.getValues().recoveryEmail,
          accountName: methods.getValues().newRecoveryAccount
        });
      }

      await updateRecovery({
        type,
        key,
        accountName: methods.getValues().newRecoveryAccount
      });

      setKeyDialog(false);
    },
    [methods, updateRecovery]
  );

  useEffect(() => {
    methods.setValue("recoveryEmail", recoveries?.[0]?.email);
  }, [recoveries]);

  useEffect(() => {
    methods.setValue("newRecoveryAccount", data?.recovery_account);
    methods.setValue("isEcency", data?.recovery_account === ECENCY);
  }, [data]);

  useEffect(() => {
    methods.setValue("isEcency", newRecoveryAccount === ECENCY);
  }, [newRecoveryAccount]);

  return (
    <div className="rounded-xl bg-white/80 dark:bg-dark-200/90 text-gray-900 dark:text-white">
      <div className="px-4 pt-4 pb-1 text-sm md:text-lg font-bold">
        {i18next.t("permissions.recovery.title")}
      </div>
      <div className="px-4 text-sm opacity-75 mb-4">{i18next.t("permissions.recovery.hint")}</div>
      <form className="px-4 pb-4 flex flex-col gap-4" onSubmit={methods.handleSubmit(update)}>
        <div>
          <label className="mb-2 text-sm opacity-50 px-2">
            {i18next.t("account-recovery.curr-recovery-acc")}
          </label>
          <FormControl
            {...methods.register("newRecoveryAccount")}
            type="text"
            autoFocus={true}
            autoComplete="off"
            aria-invalid={!!methods.formState.errors.newRecoveryAccount}
          />
          <div className="text-sm px-2 text-red">
            {methods.formState.errors.newRecoveryAccount?.message}
          </div>
          {methods.getValues().newRecoveryAccount === activeUser?.username && (
            <div className="text-sm px-2 text-red">
              {i18next.t("account-recovery.same-account-error")}
            </div>
          )}
        </div>

        {methods.getValues().isEcency && (
          <div>
            <label className="mb-2 text-sm opacity-50 px-2">
              {i18next.t("account-recovery.new-recovery-email")}
            </label>
            <InputGroup
                append={
                    !formInitiated && (
                        <Button
                            appearance="gray"
                            icon={<UilEditAlt />}
                            onClick={() => setFormInitiated(true)}
                        />
                    )
                }
            >
              <FormControl
                  {...methods.register("newRecoveryAccount")}
                  disabled={!formInitiated}
                  type="text"
                  autoFocus={true}
                  autoComplete="off"
                  aria-invalid={!!methods.formState.errors.newRecoveryAccount}
              />
            </InputGroup>
            <div className="text-sm px-2 text-red">
              {methods.formState.errors.recoveryEmail?.message}
            </div>
          </div>
        )}

        <div className="w-full flex flex-end">
          {formInitiated && (
              <Button size="sm" type="submit">
                {i18next.t("g.update")}
              </Button>
          )}
        </div>
      </form>

      <Modal
        show={keyDialog}
        centered={true}
        onHide={() => setKeyDialog(false)}
        className="recovery-dialog"
        size="lg"
      >
        <ModalHeader closeButton={true}>{i18next.t("account-recovery.sign-title")}</ModalHeader>
        <ModalBody>
          <KeyOrHot
            inProgress={isPending}
            onKey={(key) => handleSign("key", key)}
            onKc={() => handleSign("keychain")}
            onHot={() => handleSign("hivesigner")}
          />
        </ModalBody>
      </Modal>
    </div>
  );
}
