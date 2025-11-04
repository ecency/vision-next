import i18next from "i18next";
import { PropsWithChildren, ReactNode } from "react";

export function ProfileWalletTokenHistoryCard({
  children,
  action,
  title = i18next.t("profile-wallet.history")
}: PropsWithChildren<{ action?: ReactNode; title?: string }>) {
  const titlePadding = action ? "pb-0 sm:pb-4" : "pb-4";

  return (
    <div className=" bg-white/80 dark:bg-dark-200/90 glass-box rounded-xl">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div
          className={`p-4 text-sm text-gray-600 dark:text-gray-400 ${titlePadding}`}
        >
          {title}
        </div>
        {action ? (
          <div className="w-full px-4 pb-4 sm:w-auto sm:p-4 sm:pb-4">{action}</div>
        ) : null}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
