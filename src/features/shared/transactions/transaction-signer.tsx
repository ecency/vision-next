import { useGlobalStore } from "@/core/global-store";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@/features/ui";
import {
  useSignOperationByHivesigner,
  useSignOperationByKey,
  useSignOperationByKeychain
} from "@ecency/sdk";
import {
  UilArrowLeft,
  UilArrowRight,
  UilCheckCircle,
  UilTimesCircle
} from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyOrHot } from "../key-or-hot";
import { PrivateKey } from "@hiveio/dhive";
import { usePathname } from "next/navigation";
import { error } from "../feedback";

interface Props {
  show: boolean;
  onHide: () => void;
  operation: string | undefined;
}

export default function TransactionSigner({ show, onHide, operation }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const toggleUiProp = useGlobalStore((s) => s.toggleUiProp);

  const pathname = usePathname();

  const { mutateAsync: signOperationByKey, isPending: isSigningKey } = useSignOperationByKey(
    activeUser?.username as string
  );
  const { mutateAsync: signOperationByKeychain, isPending: isSigningKeychain } =
    useSignOperationByKeychain(activeUser?.username);
  const { mutateAsync: signOperationByHivesigner } = useSignOperationByHivesigner(
    `https://ecency.com/${pathname}`
  );

  const [step, setStep] = useState<"details" | "sign" | "success" | "failure">("details");

  const decodedOp = useMemo(() => {
    try {
      const obj = JSON.parse(atob(operation!));

      if (obj[1].to) {
        obj[1].from = activeUser?.username;
      }

      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return i18next.t("transactions.broken-hint");
    }
  }, [activeUser?.username, operation]);

  const handleNextStep = useCallback(() => {
    if (!activeUser) {
      onHide();
      toggleUiProp("login");
      return;
    }

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
  }, [activeUser, step, onHide, toggleUiProp, decodedOp]);

  const signByKey = useCallback(
    async (key: PrivateKey) => {
      try {
        await signOperationByKey({
          operation: JSON.parse(decodedOp),
          keyOrSeed: key.toString()
        });
        setStep("success");
      } catch (e) {
        error((e as Error).message);
        setStep("failure");
      }
    },
    [decodedOp, signOperationByKey]
  );

  const signByKc = useCallback(async () => {
    try {
      await signOperationByKeychain({ operation: JSON.parse(decodedOp) });
      setStep("success");
    } catch (e) {
      error((e as Error).message);
      setStep("failure");
    }
  }, [decodedOp, signOperationByKeychain]);

  useEffect(() => {
    if (!show) {
      setStep("details");
    }
  }, [show]);

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
          {!["failure", "success"].includes(step) && i18next.t("transactions.signer-text")}
        </div>
      </ModalHeader>

      <ModalBody>
        {step === "details" && (
          <code className="p-2 rounded-xl bg-gray-200 dark:bg-dark-default w-full block whitespace-pre">
            {decodedOp}
          </code>
        )}
        {step === "sign" && (
          <KeyOrHot
            onKey={signByKey}
            onKc={signByKc}
            onHot={() => signOperationByHivesigner({ operation: JSON.parse(decodedOp) })}
            inProgress={isSigningKey || isSigningKeychain}
          />
        )}
        {step === "success" && (
          <div className="flex flex-col gap-2 items-center">
            <UilCheckCircle className="text-green w-12 h-12" />
            <div className="font-bold text-green mb-2">{i18next.t("g.success")}</div>
            <div className="opacity-75 text-sm pb-6 text-center">
              {i18next.t("transactions.success-hint")}
            </div>
          </div>
        )}
        {step === "failure" && (
          <div className="flex flex-col gap-2 items-center">
            <UilTimesCircle className="text-red w-12 h-12" />
            <div className="font-bold text-red mb-2">{i18next.t("g.error")}</div>
            <div className="opacity-75 text-sm pb-6 text-center">
              {i18next.t("transactions.error-hint")}
            </div>
          </div>
        )}
      </ModalBody>

      {step === "details" && (
        <ModalFooter className="flex justify-end gap-2">
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
        </ModalFooter>
      )}
    </Modal>
  );
}
