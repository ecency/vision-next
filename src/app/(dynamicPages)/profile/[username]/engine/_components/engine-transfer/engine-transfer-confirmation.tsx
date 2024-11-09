import { EngineTransferFormHeader } from "@/app/(dynamicPages)/profile/[username]/engine/_components/engine-transfer/engine-transfer-form-header";
import { UserAvatar } from "@/features/shared";
import i18next from "i18next";
import { useGlobalStore } from "@/core/global-store";
import { Button } from "@/features/ui";
import { useMemo } from "react";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";

interface Props {
  titleLngKey: string;
  onBack: () => void;
  onConfirm: () => void;
  to: string;
  amount: string;
  asset: string;
  memo: string;
  mode: string;
}

export function EngineTransferConfirmation({
  titleLngKey,
  onBack,
  to,
  amount,
  asset,
  memo,
  onConfirm,
  mode
}: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const showTo = useMemo(
    () => ["transfer", "delegate", "undelegate", "stake"].includes(mode),
    [mode]
  );

  return (
    <div className="transaction-form">
      <EngineTransferFormHeader
        step={2}
        titleLngKey="confirm-title"
        subTitleLngKey="confirm-sub-title"
      />
      <div>
        <div className="py-4 md:py-8">
          <div className="flex items-center justify-center gap-4">
            <UserAvatar username={activeUser?.username ?? ""} size="large" />
            {showTo && (
              <>
                <UilArrowRight className="w-8 h-8" />
                <UserAvatar username={to} size="large" />
              </>
            )}
          </div>
          <div className="text-center text-2xl font-semibold p-4">
            <span className="text-blue-dark-sky mr-2">{amount}</span>
            {asset}
          </div>
          {memo && <div className="memo">{memo}</div>}
        </div>
        <div className="flex justify-center gap-4 p-4">
          <Button size="lg" appearance="secondary" outline={true} onClick={onBack}>
            {i18next.t("g.back")}
          </Button>
          <Button size="lg" onClick={onConfirm}>
            {i18next.t("transfer.confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}
