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
import { useMemo, type ReactNode } from "react";
import { ProfileWalletTokensListItemLoading } from "./profile-wallet-tokens-list-item-loading";
import {
  ProfileWalletClaimPointsButton,
  useProfileWalletPointsClaimState,
} from "../(token)/_components/profile-wallet-claim-points-button";
import {
  ProfileWalletHpClaimRewardsButton,
  useProfileWalletHpClaimState,
} from "../(token)/_components/profile-wallet-hp-claim-rewards-button";
import {
  ProfileWalletHbdClaimRewardsButton,
  useProfileWalletHbdClaimState,
} from "../(token)/_components/profile-wallet-hbd-claim-rewards-button";
import {
  ProfileWalletHiveClaimRewardsButton,
  useProfileWalletHiveClaimState,
} from "../(token)/_components/profile-wallet-hive-claim-rewards-button";
import {
  HiveEngineClaimRewardsButton,
  useHiveEngineClaimRewardsState,
} from "../(token)/[token]/_components/hive-engine-claim-rewards-button";

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

  const assetSymbol = useMemo(() => asset.toUpperCase(), [asset]);
  const layer2Token = useMemo(
    () => allTokens?.layer2?.find((token) => token.symbol === assetSymbol),
    [allTokens?.layer2, assetSymbol]
  );

  const logo = useMemo(() => {
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
  }, [assetSymbol, data, layer2Token]);

  const formattedAccountBalance = Number(data?.accountBalance ?? 0).toFixed(3);

  const { hasPendingPoints } = useProfileWalletPointsClaimState(
    sanitizedUsername,
    assetSymbol === "POINTS"
  );
  const { hasRewards: hasHpRewards } = useProfileWalletHpClaimState(
    sanitizedUsername,
    assetSymbol === "HP"
  );
  const { hasRewards: hasHbdRewards } = useProfileWalletHbdClaimState(
    sanitizedUsername,
    assetSymbol === "HBD"
  );
  const { hasRewards: hasHiveRewards } = useProfileWalletHiveClaimState(
    sanitizedUsername,
    assetSymbol === "HIVE"
  );
  const { hasPendingRewards: hasHiveEngineRewards } =
    useHiveEngineClaimRewardsState(
      sanitizedUsername,
      assetSymbol,
      Boolean(layer2Token)
    );

  if (!data) {
    return <ProfileWalletTokensListItemLoading />;
  }

  const targetHref = `/@${sanitizedUsername}/wallet/${asset.toLowerCase()}`;

  let claimButton: ReactNode = null;

  if (assetSymbol === "POINTS" && hasPendingPoints) {
    claimButton = (
      <ProfileWalletClaimPointsButton
        username={sanitizedUsername}
        className="w-full sm:w-auto"
        showIcon
      />
    );
  } else if (assetSymbol === "HP" && hasHpRewards) {
    claimButton = (
      <ProfileWalletHpClaimRewardsButton
        username={sanitizedUsername}
        className="w-full sm:w-auto"
        showIcon
      />
    );
  } else if (assetSymbol === "HBD" && hasHbdRewards) {
    claimButton = (
      <ProfileWalletHbdClaimRewardsButton
        username={sanitizedUsername}
        className="w-full sm:w-auto"
        showIcon
      />
    );
  } else if (assetSymbol === "HIVE" && hasHiveRewards) {
    claimButton = (
      <ProfileWalletHiveClaimRewardsButton
        username={sanitizedUsername}
        className="w-full sm:w-auto"
        showIcon
      />
    );
  } else if (hasHiveEngineRewards) {
    claimButton = (
      <HiveEngineClaimRewardsButton
        className="w-full sm:w-auto"
        tokenSymbol={assetSymbol}
        username={sanitizedUsername}
        showIcon
        fullWidth
      />
    );
  }

  const claimSection =
    claimButton && (
      <div className="px-3 pb-3 pt-3 md:px-4">
        <div className="flex flex-col items-center text-center">{claimButton}</div>
      </div>
    );

  return (
    <div className="border-b last:border-0 border-[--border-color]">
      <div className="flex flex-col">
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
            </div>
          </div>
        </Link>
        {claimSection}
      </div>
    </div>
  );
}
