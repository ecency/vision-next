import { FormattedCurrency } from "@/features/shared";
import { Badge, StyledTooltip } from "@/features/ui";
import { getAccountWalletAssetInfoQueryOptions } from "@ecency/wallets";
import i18next from "i18next";
import { useMemo } from "react";
import { TOKEN_LOGOS_MAP } from "../_consts";
import { useQuery } from "@tanstack/react-query";

interface Props {
  username: string;
  asset: string;
}

export function ProfileWalletTokensListItem({ asset, username }: Props) {
  const { data } = useQuery(getAccountWalletAssetInfoQueryOptions(username, asset));

  const logo = useMemo(() => (data ? TOKEN_LOGOS_MAP[data.name] : ""), [data]);
  const layerLogo = useMemo(() => (data?.layer ? TOKEN_LOGOS_MAP[data.layer] : ""), [data]);

  return (
    <div className="grid grid-cols-4 p-3 md:p-4 border-b last:border-0 border-[--border-color]">
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
        <div>{data?.accountBalance}</div>
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
  );
}
