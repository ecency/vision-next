"use client";

import { Button } from "@/features/ui";
import i18next from "i18next";

interface Props {
  onDelegate: () => void;
  onDismiss?: () => void;
}

export function ProfileWalletHpDelegationPromo({ onDelegate, onDismiss }: Props) {
  return (
    <div className="glass-box rounded-xl p-4 bg-blue-dark-sky-010/80 dark:bg-dark-200/90 flex flex-col gap-3">
      <div className="text-xs font-semibold uppercase tracking-widest text-blue-dark-sky">
        {i18next.t("profile-wallet.hp-delegation-promo.tag")}
      </div>
      <div>
        <div className="text-lg font-semibold">
          {i18next.t("profile-wallet.hp-delegation-promo.title")}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {i18next.t("profile-wallet.hp-delegation-promo.description")}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={onDelegate} className="w-full sm:w-auto">
          {i18next.t("profile-wallet.hp-delegation-promo.button")}
        </Button>
        {onDismiss && (
          <Button
            appearance="secondary"
            outline
            className="w-full sm:w-auto"
            onClick={onDismiss}
          >
            {i18next.t("profile-wallet.hp-delegation-promo.dismiss")}
          </Button>
        )}
      </div>
    </div>
  );
}
