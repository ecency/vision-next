import { FormattedCurrency } from "@/features/shared";
import { Badge, StyledTooltip } from "@/features/ui";
import { GeneralAssetInfo } from "@ecency/wallets";
import i18next from "i18next";

interface Props {
  item: GeneralAssetInfo;
}

export function ProfileWalletTokensListItem({ item }: Props) {
  return (
    <div
      className="grid grid-cols-4 p-2 md:p-4 border-b last:border-0 border-[--border-color]"
      key={item.name}
    >
      <StyledTooltip size="md" content={i18next.t("wallet.hive-description")}>
        <div>{item.title}</div>
        <div className="text-xs text-gray-500 uppercase font-semibold">{item.name}</div>
      </StyledTooltip>
      <div>{item.apr && <Badge>{item.apr}% APR</Badge>}</div>
      <div className="text-blue-dark-sky">
        <FormattedCurrency value={item.price} fixAt={3} />
      </div>
      <div>
        <div>{item.accountBalance}</div>
        {item.parts?.map(({ name, balance }) => (
          <div className="flex items-center pl-2 gap-1 text-xs text-gray-600 dark:text-gray-500">
            <div>{name}:</div>
            <div>{balance}</div>
          </div>
        ))}
        <div className="text-gray-600 dark:text-gray-400 text-sm">
          <FormattedCurrency value={item.accountBalance * item.price} fixAt={2} />
        </div>
      </div>
    </div>
  );
}
