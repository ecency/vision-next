import { FormattedCurrency } from "@/features/shared";
import { Badge, StyledTooltip } from "@/features/ui";
import {
  getAccountWalletAssetInfoQueryOptions,
  getAllTokensListQueryOptions
} from "@ecency/wallets";
import i18next from "i18next";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { proxifyImageSrc } from "@ecency/render-helper";
import { ProfileWalletTokensListItemPoints } from "./profile-wallet-tokens-list-item-points";
import { useRouter } from "next/navigation";
import { TOKEN_LOGOS_MAP } from "@/features/wallet";

interface Props {
  username: string;
  asset: string;
}

export function ProfileWalletTokensListItem({ asset, username }: Props) {
  const { data } = useQuery(getAccountWalletAssetInfoQueryOptions(username, asset));
  const { data: allTokens } = useQuery(getAllTokensListQueryOptions(username));

  const router = useRouter();

  const logo = useMemo(() => {
    const layer2Token = allTokens?.layer2?.find((token) => token.symbol === asset);
    if (layer2Token) {
      return (
        <Image
          alt=""
          src={proxifyImageSrc(JSON.parse(layer2Token.metadata)?.icon, 32, 32, "match")}
          width={32}
          height={32}
          className="rounded-lg p-1 object-cover min-w-[32px] max-w-[32px] h-[32px] border border-[--border-color]"
        />
      );
    }
    if (data) {
      return TOKEN_LOGOS_MAP[data.name];
    }
  }, [allTokens?.layer2, asset, data]);

  if (!data) {
    <div className="border-b last:border-0 border-[--border-color] grid grid-cols-4 gap-4 p-3 md:p-4">
      <div className="w-full rounded-lg animate-pulse h-[44px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      <div className="w-full rounded-lg animate-pulse h-[44px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      <div className="w-full rounded-lg animate-pulse h-[44px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      <div className="w-full rounded-lg animate-pulse h-[44px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
    </div>;
  }

  return (
    <div
      className="border-b last:border-0 border-[--border-color] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900"
      onClick={() => router.push(`/@${username}/wallet/${asset.toLowerCase()}`)}
    >
      <div className="grid grid-cols-4 p-3 md:p-4">
        <div className="flex items-start gap-2 md:gap-3 col-span-2 sm:col-span-1">
          <div className="mt-1">{logo}</div>
          <StyledTooltip size="md" content={i18next.t("wallet.hive-description")}>
            <div>{data?.title}</div>
            <div className="flex items-center gap-1">
              <div className="text-xs text-gray-500 uppercase font-semibold">{data?.name}</div>
              {data?.layer && (
                <Badge className="!rounded-lg !p-0 !px-1" appearance="secondary">
                  {data.layer}
                </Badge>
              )}
            </div>
          </StyledTooltip>
        </div>
        <div className="hidden sm:block">{data?.apr && <Badge>{+data.apr}% APR</Badge>}</div>
        <div className="text-blue-dark-sky">
          <FormattedCurrency value={data?.price ?? 0} fixAt={3} />
        </div>
        <div>
          <div>{data?.accountBalance.toFixed(3)}</div>
          {data?.parts?.map(({ name, balance }) => (
            <div
              key={name}
              className="flex items-center pl-2 gap-1 text-xs text-gray-600 dark:text-gray-500"
            >
              <div>{name}:</div>
              <div>{balance}</div>
            </div>
          ))}
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            <FormattedCurrency value={(data?.accountBalance ?? 0) * (data?.price ?? 0)} fixAt={2} />
          </div>
        </div>
      </div>
      {asset === "POINTS" && <ProfileWalletTokensListItemPoints username={username} />}
    </div>
  );
}
