import { Suspense } from "react";
import { ProfileWalletSummary } from "./profile-wallet-summary";

function WalletSummarySkeleton() {
  return (
    <div className="bg-white rounded-xl p-3 mb-4 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="w-[60px] rounded-lg animate-pulse h-[20px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="w-[120px] rounded-lg animate-pulse h-[28px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      </div>
      <div className="flex w-full gap-0.5">
        <div className="w-[40%] rounded-lg animate-pulse h-[36px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="w-[30%] rounded-lg animate-pulse h-[36px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="w-[30%] rounded-lg animate-pulse h-[36px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      </div>
    </div>
  );
}

export function ProfileWalletSummaryWrapper() {
  return (
    <Suspense fallback={<WalletSummarySkeleton />}>
      <ProfileWalletSummary />
    </Suspense>
  );
}
