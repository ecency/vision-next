import { PropsWithChildren } from "react";

export function ProfileWalletTokenHistoryCard({ children }: PropsWithChildren) {
  return (
    <div className=" bg-white/80 dark:bg-dark-200/90 glass-box rounded-xl">
      <div className="p-4 text-sm text-gray-600 dark:text-gray-400">History</div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
