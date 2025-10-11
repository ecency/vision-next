import { FormattedCurrency } from "@/features/shared";
import { Badge } from "@/features/ui";
import { useGetTokenLogoImage } from "@/features/wallet";
import { getAccountWalletAssetInfoQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { useParams, usePathname } from "next/navigation";

function format(value: number) {
  const formatter = new Intl.NumberFormat();
  return formatter.format(value);
}

export function ProfileWalletTokenSummary() {
  const { token, username } = useParams();

  const pathname = usePathname();
  const tokenWithFallback =
    (token as string)?.toUpperCase() ?? pathname.split("/")[3]?.toUpperCase();

  const { data, isFetching } = useQuery(
    getAccountWalletAssetInfoQueryOptions(
      (username as string).replace("%40", ""),
      tokenWithFallback
    )
  );

  const logo = useGetTokenLogoImage((username as string).replace("%40", ""), tokenWithFallback);

  if (isFetching) {
    <div className="bg-white/80 dark:bg-dark-200/90 glass-box rounded-xl p-3 flex flex-col justify-between gap-4">
      <div className="flex justify-between">
        <div className="w-[90px] rounded-lg animate-pulse h-[44px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="w-[56px] rounded-lg animate-pulse h-[24px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      </div>
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="w-[56px] rounded-lg animate-pulse h-[64px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="w-full rounded-lg animate-pulse h-[64px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="w-full rounded-lg animate-pulse h-[64px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      </div>
    </div>;
  }

  return (
    <div className="bg-white/80 dark:bg-dark-200/90 glass-box rounded-xl p-3 flex flex-col justify-between gap-4">
      <div className="flex justify-between">
        <div className="flex items-start gap-2 md:gap-3 col-span-2 sm:col-span-1">
          <div className="mt-1">{logo}</div>
          <div>
            <div className="text-xl font-bold">{data?.title}</div>
            <div className="flex items-center gap-1">
              <div className="text-xs text-gray-500 uppercase font-semibold">{data?.name}</div>
              {data?.layer && (
                <Badge className="!rounded-lg !p-0 !px-1" appearance="secondary">
                  {data.layer}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="text-blue-dark-sky">
          <FormattedCurrency value={data?.price ?? 0} fixAt={3} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-xl">
          <div className="text-sm text-gray-600 dark:text-gray-400">Balance</div>
          <div className="text-xl font-bold">{format(data?.accountBalance ?? 0)}</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-xl">
          <div className="text-sm text-gray-600 dark:text-gray-400">USD Balance</div>
          <div className="text-xl font-bold">
            {format((data?.accountBalance ?? 0) * (data?.price ?? 0))}
          </div>
        </div>
        {data?.apr && (
          <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-xl">
            <div className="text-sm text-gray-600 dark:text-gray-400">APR</div>
            <div className="text-xl font-bold">{+data.apr}%</div>
          </div>
        )}
      </div>
    </div>
  );
}
