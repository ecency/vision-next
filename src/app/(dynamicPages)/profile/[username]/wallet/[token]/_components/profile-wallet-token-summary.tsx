import { FormattedCurrency } from "@/features/shared";
import {
  getAccountWalletAssetInfoQueryOptions,
  getAllTokensListQueryOptions
} from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import Image from "next/image";
import { proxifyImageSrc } from "@ecency/render-helper";
import { TOKEN_LOGOS_MAP } from "../../_consts";
import { Badge, StyledTooltip } from "@/features/ui";
import i18next from "i18next";

export default function ProfileWalletTokenSummary() {
  const { token, username } = useParams();

  const { data } = useQuery(
    getAccountWalletAssetInfoQueryOptions(
      (username as string).replace("%40", ""),
      (token as string).toUpperCase()
    )
  );

  const { data: allTokens } = useQuery(
    getAllTokensListQueryOptions((username as string).replace("%40", ""))
  );

  const logo = useMemo(() => {
    const layer2Token = allTokens?.layer2?.find(
      (token) => token.symbol === data?.name.toUpperCase()
    );
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
  }, [allTokens?.layer2, data]);

  return (
    <div className="bg-white rounded-xl p-3 flex flex-col justify-between gap-4">
      <div className="flex justify-between">
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
        <div className="text-blue-dark-sky">
          <FormattedCurrency value={data?.price ?? 0} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-xl">
          <div className="text-sm text-gray-600 dark:text-gray-400">Balance</div>
          <div className="text-xl font-bold">{data?.accountBalance?.toFixed(2) ?? 0}</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-xl">
          <div className="text-sm text-gray-600 dark:text-gray-400">USD Balance</div>
          <div className="text-xl font-bold">
            {((data?.accountBalance ?? 0) * (data?.price ?? 0)).toFixed(2)}
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
