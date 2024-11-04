import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import { useMemo, useState } from "react";
import { EngineTransferStep1 } from "@/app/(dynamicPages)/profile/[username]/engine/_components/engine-transfer/engine-transfer-step-1";
import { useHiveEngineAssetWallet } from "@/api/queries";

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
        {step === 1 && (
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
          />
        )}
      </ModalBody>
    </Modal>
  );
}
