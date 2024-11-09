import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import { useCallback, useMemo, useState } from "react";
import { EngineTransferStep1 } from "@/app/(dynamicPages)/profile/[username]/engine/_components/engine-transfer/engine-transfer-step-1";
import { useHiveEngineAssetWallet } from "@/api/queries";
import { EngineTransferPowerDown } from "@/app/(dynamicPages)/profile/[username]/engine/_components/engine-transfer/engine-transfer-power-down";
import { EngineTransferConfirmation } from "@/app/(dynamicPages)/profile/[username]/engine/_components/engine-transfer/engine-transfer-confirmation";
import { EngineTransferSign } from "@/app/(dynamicPages)/profile/[username]/engine/_components/engine-transfer/engine-transfer-sign";
import { EngineTransferSuccess } from "@/app/(dynamicPages)/profile/[username]/engine/_components/engine-transfer/engine-transfer-success";

interface Props {
  onHide: () => void;
  mode: string;
  asset: string;
  to?: string;
}

export function EngineTransfer({ onHide, mode, asset, to: preTo }: Props) {
  const [step, setStep] = useState(1);
  const [to, setTo] = useState(preTo ?? "");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  const assetWallet = useHiveEngineAssetWallet(asset);
  const precision = useMemo(() => (assetWallet?.balance + "").split(".")[1]?.length || 3, []);
  const titleLngKey = useMemo(
    () => (mode === "transfer" ? `${mode}-title` : `${mode}-hive-engine-title`),
    [mode]
  );
  const subTitleLngKey = useMemo(
    () => (mode === "transfer" ? `${mode}-sub-title` : `${mode}-hive-engine-sub-title`),
    [mode]
  );

  const reset = useCallback(() => {
    setStep(1);
    setTo(preTo ?? "");
    setAmount("");
    setMemo("");
  }, [preTo]);

  return (
    <Modal
      animation={false}
      show={true}
      centered={true}
      onHide={onHide}
      className="transfer-dialog"
      size="lg"
    >
      <ModalHeader thin={true} closeButton={true} />
      <ModalBody>
        {step === 1 && mode !== "unstake" && (
          <EngineTransferStep1
            asset={asset}
            subTitleLngKey={subTitleLngKey}
            titleLngKey={titleLngKey}
            mode={mode}
            to={to}
            setTo={setTo}
            amount={amount}
            setAmount={setAmount}
            memo={memo}
            setMemo={setMemo}
            onNext={() => setStep(2)}
            precision={precision}
          />
        )}
        {step === 1 && mode === "unstake" && (
          <EngineTransferPowerDown
            precision={precision}
            titleLngKey={titleLngKey}
            subTitleLngKey={subTitleLngKey}
            onNext={() => setStep(2)}
            asset={asset}
          />
        )}
        {step === 2 && (
          <EngineTransferConfirmation
            titleLngKey={titleLngKey}
            onBack={() => setStep(1)}
            onConfirm={() => setStep(3)}
            to={to}
            amount={amount}
            asset={asset}
            memo={memo}
            mode={mode}
          />
        )}
        {step === 3 && (
          <EngineTransferSign
            asset={asset}
            memo={memo}
            mode={mode}
            amount={amount}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
            to={to}
          />
        )}
        {step === 4 && (
          <EngineTransferSuccess
            to={to}
            amount={amount}
            asset={asset}
            mode={mode}
            onFinish={onHide}
            onReset={reset}
          />
        )}
      </ModalBody>
    </Modal>
  );
}
