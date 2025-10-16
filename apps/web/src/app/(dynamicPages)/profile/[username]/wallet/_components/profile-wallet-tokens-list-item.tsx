import { FormattedCurrency } from "@/features/shared";
import { Badge } from "@/features/ui";
import { TOKEN_LOGOS_MAP } from "@/features/wallet";
import { getLayer2TokenIcon } from "@/features/wallet/utils/get-layer2-token-icon";
import { sanitizeWalletUsername } from "@/features/wallet/utils/sanitize-username";
import { proxifyImageSrc } from "@ecency/render-helper";
import {
  getAccountWalletAssetInfoQueryOptions,
  getAllTokensListQueryOptions
} from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { ProfileWalletTokensListItemPoints } from "./profile-wallet-tokens-list-item-points";
import { ProfileWalletTokensListItemLoading } from "./profile-wallet-tokens-list-item-loading";

interface Props {
  username: string;
  asset: string;
}

export function ProfileWalletTokensListItem({ asset, username }: Props) {
  const sanitizedUsername = useMemo(
    () => sanitizeWalletUsername(username),
    [username]
  );

  const { data } = useQuery(
    getAccountWalletAssetInfoQueryOptions(sanitizedUsername, asset)
  );
  const { data: allTokens } = useQuery(
    getAllTokensListQueryOptions(sanitizedUsername)
  );

  const logo = useMemo(() => {
    const layer2Token = allTokens?.layer2?.find((token) => token.symbol === asset);
    if (layer2Token) {
      const icon = getLayer2TokenIcon(layer2Token.metadata);

      if (icon) {
        return (
          <Image
            alt=""
            src={proxifyImageSrc(icon, 32, 32, "match")}
            width={32}
            height={32}
            className="rounded-lg p-1 object-cover min-w-[32px] max-w-[32px] h-[32px] border border-[--border-color]"
          />
        );
      }

      return (
        <div className="rounded-lg min-w-[32px] max-w-[32px] h-[32px] border border-[--border-color] flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-[10px] font-semibold uppercase text-gray-600 dark:text-gray-200">
          {layer2Token.symbol.slice(0, 3)}
        </div>
      );
    }
    if (data) {
      return TOKEN_LOGOS_MAP[data.name];
    }

    return undefined;
  }, [allTokens?.layer2, asset, data]);

  if (!data) {
    return <ProfileWalletTokensListItemLoading />;
  }

  const formattedAccountBalance = data.accountBalance.toFixed(3);
  const totalBalanceValue = (data.accountBalance ?? 0) * (data.price ?? 0);

  const formatPartLabel = (name?: string) => {
    if (!name) {
      return "";
    }

    if (name === "current") {
      return "Current";
    }

    if (name === "savings") {
      return "Savings";
    }

    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const targetHref = `/@${sanitizedUsername}/wallet/${asset.toLowerCase()}`;

  return (
    <div className="border-b last:border-0 border-[--border-color]">
      <Link
        href={targetHref}
        className="block cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-dark-sky"
      >
        <div className="grid grid-cols-4 p-3 md:p-4">
          <div className="flex items-start gap-2 md:gap-3 col-span-2 sm:col-span-1">
            <div className="mt-1">{logo}</div>
            <div>
              <div>{data?.title}</div>
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
          <div className="hidden sm:block">{data?.apr && <Badge>{+data.apr}% APR</Badge>}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <FormattedCurrency value={data?.price ?? 0} fixAt={3} />
          </div>
          <div className="text-gray-900 dark:text-white">
            <div className="text-base font-semibold">{formattedAccountBalance}</div>
            {data?.parts?.map(({ name, balance }, index) => {
              const label = formatPartLabel(name);

              return (
                <div
                  key={name || `part-${index}`}
                  className="flex items-center pl-2 gap-1 text-xs text-gray-600 dark:text-gray-500"
                >
                  <div>{label ? `${label}:` : ""}</div>
                  <div>{Number(balance).toFixed(3)}</div>
                </div>
              );
            })}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <FormattedCurrency value={totalBalanceValue} fixAt={2} />
            </div>
          </div>
        </div>
      </Link>
      {asset === "POINTS" && (
        <ProfileWalletTokensListItemPoints username={sanitizedUsername} />
      )}
    </div>
  );
}
