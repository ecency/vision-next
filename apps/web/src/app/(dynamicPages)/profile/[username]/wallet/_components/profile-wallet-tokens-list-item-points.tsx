import { useGlobalStore } from "@/core/global-store";
import i18next from "i18next";
import Link from "next/link";
import { ProfileWalletPointsInfo } from "./profile-wallet-points-info";
import { UilArrowUpRight } from "@tooni/iconscout-unicons-react";

interface Props {
  username: string;
}

export function ProfileWalletTokensListItemPoints({ username }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  return (
    <div className="px-4 pb-4 flex justify-between items-end">
      <div>
        <div className="text-sm opacity-50 mb-2">{i18next.t("points.earn-points")}</div>
        <ProfileWalletPointsInfo />
      </div>
      {activeUser?.username === username && (
        <Link target="_external" href="/perks/points" className="flex items-center mb-4">
          {i18next.t("points.get")}
          <UilArrowUpRight />
        </Link>
      )}
    </div>
  );
}
