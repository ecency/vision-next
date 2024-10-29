import { EngineTransferFormHeader } from "@/app/(dynamicPages)/profile/[username]/engine/_components/engine-transfer/engine-transfer-form-header";
import i18next from "i18next";
import { Button } from "@ui/button";
import { dateToFullRelative, formatNumber, useActiveUserWallet } from "@/utils";

interface Props {
  titleLngKey: string;
  subTitleLngKey: string;
  onNext: () => void;
  asset: string;
}

export function EngineTransferPowerDown({ titleLngKey, subTitleLngKey, onNext, asset }: Props) {
  const activeUserWallet = useActiveUserWallet();

  return (
    <div className="transfer-dialog-content">
      <div className="transaction-form">
        <EngineTransferFormHeader titleLngKey={titleLngKey} subTitleLngKey={subTitleLngKey} />
        <div className="transaction-form-body powering-down">
          <p>{i18next.t("transfer.powering-down")}</p>
          <p>
            {" "}
            {activeUserWallet &&
              i18next.t("wallet.next-power-down", {
                time: dateToFullRelative(activeUserWallet.nextVestingWithdrawalDate.toString()),
                amount: `${formatNumber(
                  activeUserWallet.nextVestingSharesWithdrawalHive,
                  precision
                )} ${asset}`,
                weeks: activeUserWallet.weeksLeft
              })}
          </p>
          <p>
            <Button onClick={onNext} appearance="danger">
              {i18next.t("transfer.stop-power-down")}
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
