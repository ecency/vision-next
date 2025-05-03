"use client";

import { FormattedCurrency } from "@/features/shared";
import { getAccountWalletListQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useParams } from "next/navigation";

export default function ProfileWalletTokensList() {
  const { username } = useParams();
  const { data } = useQuery(
    getAccountWalletListQueryOptions((username as string).replace("%40", ""))
  );

  return (
    <div className="bg-white rounded-xl">
      <div className="grid text-sm grid-cols-3 p-2 md:p-3 text-gray-600 dark:text-gray-400 border-b border-[--border-color]">
        <div>{i18next.t("profile-wallet.asset-name")}</div>
        <div>{i18next.t("profile-wallet.price")}</div>
        <div>{i18next.t("profile-wallet.balance")}</div>
      </div>
      {data?.map((item) => (
        <div
          className="grid grid-cols-3 p-2 md:p-4 border-b last:border-0 border-[--border-color]"
          key={item.name}
        >
          <div>
            <div>{item.title}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold">
              {item.name}
            </div>
          </div>
          <div className="text-blue-dark-sky">
            <FormattedCurrency value={item.price} fixAt={3} />
          </div>
          <div>
            <div>{item.accountBalance}</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              <FormattedCurrency value={item.accountBalance * item.price} fixAt={2} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
