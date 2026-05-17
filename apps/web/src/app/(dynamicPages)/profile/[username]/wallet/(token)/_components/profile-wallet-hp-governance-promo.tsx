"use client";

import { useState } from "react";
import i18next from "i18next";
import { Button, ModalConfirm } from "@/features/ui";
import { Spinner } from "@ui/spinner";
import { error, success } from "@/features/shared";
import { formatError } from "@/api/format-error";
import { useWitnessProxyMutation } from "@/api/sdk-mutations";

const ECENCY_ACCOUNT = "ecency";

interface Props {
  onDismiss?: () => void;
  onProxySet?: () => void;
}

export function ProfileWalletHpGovernancePromo({ onDismiss, onProxySet }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { mutateAsync, isPending } = useWitnessProxyMutation();

  const setProxy = async () => {
    setShowConfirm(false);
    try {
      await mutateAsync({ proxy: ECENCY_ACCOUNT });
      success(i18next.t("profile-wallet.hp-governance-promo.success"));
      onProxySet?.();
    } catch (e) {
      error(...formatError(e));
    }
  };

  return (
    <>
      <div className="glass-box rounded-xl p-4 bg-blue-dark-sky-010/80 dark:bg-dark-200/90 flex flex-col gap-3">
        <div className="text-xs font-semibold uppercase tracking-widest text-blue-dark-sky">
          {i18next.t("profile-wallet.hp-governance-promo.tag")}
        </div>
        <div>
          <div className="text-lg font-semibold">
            {i18next.t("profile-wallet.hp-governance-promo.title")}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {i18next.t("profile-wallet.hp-governance-promo.description")}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={isPending}
            icon={isPending && <Spinner className="mr-[6px] w-3.5 h-3.5" />}
            iconPlacement="left"
            className="w-full sm:w-auto"
          >
            {i18next.t("profile-wallet.hp-governance-promo.button")}
          </Button>
          {onDismiss && (
            <Button
              appearance="secondary"
              outline
              disabled={isPending}
              className="w-full sm:w-auto"
              onClick={onDismiss}
            >
              {i18next.t("profile-wallet.hp-governance-promo.dismiss")}
            </Button>
          )}
        </div>
      </div>
      {showConfirm && (
        <ModalConfirm
          titleText={i18next.t("profile-wallet.hp-governance-promo.confirm-title")}
          descriptionText={i18next.t(
            "profile-wallet.hp-governance-promo.confirm-description"
          )}
          okText={i18next.t("profile-wallet.hp-governance-promo.confirm-ok")}
          onConfirm={setProxy}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
