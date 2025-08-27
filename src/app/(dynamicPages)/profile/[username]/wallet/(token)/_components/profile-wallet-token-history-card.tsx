import i18next from "i18next";
import { PropsWithChildren, ReactNode } from "react";

export function ProfileWalletTokenHistoryCard({
  children,
  action
}: PropsWithChildren<{ action: ReactNode }>) {
  return (
    <div className=" bg-white/80 dark:bg-dark-200/90 glass-box rounded-xl">
      <div className="flex justify-between items-start w-full">
        <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
          {i18next.t("profile-wallet.history")}
        </div>
        <div className="p-4">{action}</div>
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
