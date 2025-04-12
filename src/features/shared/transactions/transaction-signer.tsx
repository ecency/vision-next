import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@/features/ui";
import { UilArrowLeft, UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useCallback, useMemo, useState } from "react";
import { KeyOrHot } from "../key-or-hot";

interface Props {
  show: boolean;
  onHide: () => void;
  operation: string | undefined;
}

export function TransactionSigner({ show, onHide, operation }: Props) {
  const [step, setStep] = useState<"details" | "sign" | "success" | "failure">("details");

  const decodedOp = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(atob(operation!)), null, 2);
    } catch (e) {
      return i18next.t("transactions.broken-hint");
    }
  }, [operation]);

  const handleNextStep = useCallback(() => {
    switch (step) {
      case "details":
        if (decodedOp !== i18next.t("transactions.broken-hint")) {
          setStep("sign");
        }
        break;
      case "sign":
        setStep("success");
        break;
      default:
        setStep("details");
    }
  }, [step, decodedOp]);

  return (
    <Modal centered={true} show={show} onHide={onHide}>
      <ModalHeader closeButton={true}>
        <div className="flex items-center gap-2 h-8">
          {step === "sign" && (
            <Button
              icon={<UilArrowLeft />}
              appearance="gray-link"
              size="sm"
              noPadding={true}
              onClick={() => setStep("details")}
            />
          )}
          {i18next.t("transactions.signer-text")}
        </div>
      </ModalHeader>

      <ModalBody>
        {step === "details" && (
          <>
            <code className="p-2 rounded-xl bg-gray-200 dark:bg-dark-default w-full block whitespace-pre">
              {decodedOp}
            </code>
          </>
        )}
        {step === "sign" && (
          <KeyOrHot onKey={() => {}} onHot={() => {}} onKc={() => {}} inProgress={false} />
        )}
      </ModalBody>

      <ModalFooter className="flex justify-end gap-2">
        {step === "details" && (
          <>
            <Button size="sm" appearance="gray" onClick={onHide}>
              {i18next.t("g.cancel")}
            </Button>
            <Button
              size="sm"
              icon={<UilArrowRight />}
              onClick={handleNextStep}
              disabled={decodedOp === i18next.t("transactions.broken-hint")}
            >
              {i18next.t("g.continue")}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
