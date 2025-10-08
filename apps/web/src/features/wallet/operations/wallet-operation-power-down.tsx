import { Button } from "@/features/ui";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { WalletOperationCard } from "./wallet-opearation-card";

interface Props {
  asset: string;
  username: string;
  showSubmit: boolean;
  showMemo?: boolean;
  onSubmit: () => void;
}

export function WalletOperationPowerDown({ username, asset, onSubmit, showSubmit }: Props) {
  return (
    <div className="grid gap-4">
      <div>
        <WalletOperationCard label="from" asset={asset} username={username} />
      </div>

      <div className="flex border-t border-[--border-color] justify-between items-center p-4">
        <div className="flex flex-col text-sm">
          <div className="uppercase text-xs font-semibold text-gray-600 dark:text-gray-400">
            fee
          </div>
          <div className="text-black dark:text-white font-semibold">0.0%</div>
        </div>

        {showSubmit && (
          <Button type="submit" icon={<UilArrowRight />} onClick={onSubmit}>
            {i18next.t("g.continue")}
          </Button>
        )}
      </div>
    </div>
  );
}
