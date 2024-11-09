import { EngineTransferFormHeader } from "@/app/(dynamicPages)/profile/[username]/engine/_components/engine-transfer/engine-transfer-form-header";
import i18next from "i18next";
import { Button } from "@ui/button";
import { useGlobalStore } from "@/core/global-store";
import { UilCheckCircle } from "@tooni/iconscout-unicons-react";

interface Props {
  mode: string;
  amount: string;
  asset: string;
  onFinish: () => void;
  onReset: () => void;
  to: string;
}

export function EngineTransferSuccess({ mode, onFinish, amount, asset, to, onReset }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  return (
    <div className="transaction-form">
      <EngineTransferFormHeader
        step={4}
        titleLngKey="success-title"
        subTitleLngKey="success-sub-title"
      />
      <div className="flex items-center justify-center flex-col gap-4 py-4 md:my-8">
        <UilCheckCircle className="w-16 h-16 text-green" />
        <div
          dangerouslySetInnerHTML={{
            __html: i18next.t(`transfer.${mode}-summary`, {
              amount: `${amount} ${asset}`,
              from: activeUser?.username,
              to
            })
          }}
        />
        <div className="flex justify-center gap-4">
          <Button appearance="secondary" outline={true} onClick={onReset}>
            {i18next.t("transfer.reset")}
          </Button>
          <Button onClick={onFinish}>{i18next.t("g.finish")}</Button>
        </div>
      </div>
    </div>
  );
}
