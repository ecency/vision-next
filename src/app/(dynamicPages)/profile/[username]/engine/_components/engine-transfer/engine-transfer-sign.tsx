import { EngineTransferFormHeader } from "@/app/(dynamicPages)/profile/[username]/engine/_components/engine-transfer/engine-transfer-form-header";
import i18next from "i18next";
import { KeyOrHot } from "@/features/shared";
import {
  useTransferEngineByHivesigner,
  useTransferEngineByKey,
  useTransferEngineByKeychain
} from "@/app/(dynamicPages)/profile/[username]/engine/_mutations";

interface Props {
  mode: string;
  to: string;
  amount: string;
  asset: string;
  memo: string;
  onBack: () => void;
  onNext: () => void;
}

export function EngineTransferSign({ onBack, mode, asset, to, amount, memo, onNext }: Props) {
  const { mutateAsync: signKey, isPending: isSigningByKey } = useTransferEngineByKey(onNext);
  const { mutateAsync: signKeychain, isPending: isSigningByKeychain } =
    useTransferEngineByKeychain(onNext);
  const signHivesigner = useTransferEngineByHivesigner(onNext);

  return (
    <div className="transaction-form">
      <EngineTransferFormHeader
        step={3}
        titleLngKey={i18next.t("trx-common.sign-title")}
        subTitleLngKey={i18next.t("trx-common.sign-sub-title")}
      />
      <div className="transaction-form">
        <KeyOrHot
          inProgress={isSigningByKey || isSigningByKeychain}
          onKey={(key) =>
            signKey({
              key,
              asset,
              amount,
              memo,
              mode,
              to
            })
          }
          onHot={() =>
            signHivesigner({
              asset,
              amount,
              memo,
              mode,
              to
            })
          }
          onKc={() =>
            signKeychain({
              asset,
              amount,
              memo,
              mode,
              to
            })
          }
        />
        <p className="text-center">
          <a href="#" onClick={onBack}>
            {i18next.t("g.back")}
          </a>
        </p>
      </div>
    </div>
  );
}
