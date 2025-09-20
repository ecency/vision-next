import { useClientActiveUser } from "@/api/queries";
import { WalletOperationsDialog } from "@/features/wallet";
import { AssetOperation, getTokenOperationsQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import {
  UilArrowDownRight,
  UilArrowRight,
  UilArrowsHAlt,
  UilBoltAlt,
  UilChartBar,
  UilCodeBranch,
  UilGift,
  UilLock,
  UilMoneybag,
  UilPlus,
  UilUnlock,
  UilUserPlus
} from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import i18next from "i18next";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ReactNode } from "react";

const operationsIcons: Partial<Record<AssetOperation, ReactNode>> = {
  [AssetOperation.Transfer]: <UilArrowRight />,
  [AssetOperation.TransferToSavings]: <UilMoneybag />,
  [AssetOperation.PowerUp]: <UilBoltAlt />,
  [AssetOperation.PowerDown]: <UilArrowDownRight />,
  [AssetOperation.WithdrawRoutes]: <UilCodeBranch />,
  [AssetOperation.Delegate]: <UilUserPlus />,
  [AssetOperation.Swap]: <UilArrowsHAlt />,
  [AssetOperation.Gift]: <UilGift />,
  [AssetOperation.Promote]: <UilChartBar />,
  [AssetOperation.Claim]: <UilPlus />,
  [AssetOperation.Buy]: <UilBoltAlt />,
  [AssetOperation.LockLiquidity]: <UilLock />,
  [AssetOperation.Stake]: <UilLock />,
  [AssetOperation.Unstake]: <UilUnlock />
};

export function ProfileWalletTokenActions() {
  const activeUser = useClientActiveUser();
  const { token, username } = useParams();
  const pathname = usePathname();

  const cleanUsername = (username as string).replace("%40", "");

  const { data: operations } = useQuery(
    getTokenOperationsQueryOptions(
      (token as string)?.toUpperCase() ?? pathname.split("/")[3]?.toUpperCase(),
      cleanUsername,
      activeUser?.username === cleanUsername
    )
  );

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-2 grid-rows-2">
      {operations?.map((operation) => (
        <>
          {[AssetOperation.Buy, AssetOperation.Promote, AssetOperation.Claim].includes(
            operation
          ) && (
            <Link
              href={
                [AssetOperation.Buy, AssetOperation.Claim].includes(operation)
                  ? "/perks/points"
                  : "/perks/promote-post"
              }
              className={clsx(
                " bg-white/80 dark:bg-dark-200/90 glass-box rounded-xl p-3 flex flex-col sm:flex-row items-center text-center text-sm gap-2 cursor-pointer border border-white dark:border-dark-200 hover:border-blue-dark-sky dark:hover:border-blue-dark-sky hover:text-blue-dark-sky duration-300 min-h-[66px]",
                AssetOperation.Buy === operation && "text-blue-dark-sky border-blue-dark-sky"
              )}
            >
              {operationsIcons[operation]}
              <div className="w-full font-bold">
                {i18next.t(`profile-wallet.operations.${operation}`)}
              </div>
            </Link>
          )}

          {![AssetOperation.Buy, AssetOperation.Promote, AssetOperation.Claim].includes(
            operation
          ) && (
            <WalletOperationsDialog
              className=" bg-white/80 dark:bg-dark-200/90 glass-box rounded-xl p-3 flex flex-col sm:flex-row items-center text-center text-sm gap-2 cursor-pointer border border-white dark:border-dark-200 hover:border-blue-dark-sky dark:hover:border-blue-dark-sky hover:text-blue-dark-sky duration-300 min-h-[66px]"
              key={operation}
              asset={(token as string)?.toUpperCase() ?? pathname.split("/")[3]?.toUpperCase()}
              operation={operation}
              to={
                cleanUsername && cleanUsername !== activeUser?.username ? cleanUsername : undefined
              }
            >
              {operationsIcons[operation]}
              <div className="w-full font-bold">
                {i18next.t(`profile-wallet.operations.${operation}`)}
              </div>
            </WalletOperationsDialog>
          )}
        </>
      ))}
      {new Array(4 - (operations?.length ?? 0)).fill(1).map((_, i) => (
        <div
          className=" bg-white/40 dark:bg-dark-200/40 rounded-xl p-3 flex flex-col gap-4 min-h-[66px]"
          key={i}
        />
      ))}
    </div>
  );
}
