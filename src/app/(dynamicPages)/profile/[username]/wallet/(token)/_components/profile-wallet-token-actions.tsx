import { useClientActiveUser } from "@/api/queries";
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
  UilMoneybag,
  UilPlus,
  UilUserPlus
} from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import i18next from "i18next";
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
  [AssetOperation.Buy]: <UilBoltAlt />
};

export default function ProfileWalletTokenActions() {
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
    <div className="grid grid-cols-3 gap-2 md:gap-4 grid-rows-2">
      {operations?.map((operation) => (
        <div
          className={clsx(
            "bg-white rounded-xl p-3 flex flex-col sm:flex-row items-center text-center text-sm gap-2 cursor-pointer border border-white dark:border-dark-200 hover:border-blue-dark-sky dark:hover:border-blue-dark-sky hover:text-blue-dark-sky duration-300",
            AssetOperation.Buy === operation && "text-blue-dark-sky border border-blue-dark-sky"
          )}
          key={operation}
        >
          {operationsIcons[operation]}
          <div className="w-full font-bold">
            {i18next.t(`profile-wallet.operations.${operation}`)}
          </div>
        </div>
      ))}
      {new Array(6 - (operations?.length ?? 0)).fill(1).map((_, i) => (
        <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-3 flex flex-col gap-4" key={i} />
      ))}
    </div>
  );
}
