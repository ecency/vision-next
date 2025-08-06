import { useClientActiveUser } from "@/api/queries";
import { AssetOperation } from "@ecency/wallets";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { HTMLProps, PropsWithChildren, useState } from "react";
import { Button, Modal, ModalHeader } from "../ui";
import {
  WalletOperationError,
  WalletOperationSign,
  WalletOperationsTransfer,
  WalletOperationSuccess
} from "./operations";

interface Props {
  operation: AssetOperation;
  asset: string;
}

export function WalletOperationsDialog({
  children,
  operation,
  asset,
  ...divProps
}: PropsWithChildren<Props> & HTMLProps<HTMLDivElement>) {
  const activeUser = useClientActiveUser();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"form" | "sign" | "success" | "error">("form");
  const [data, setData] = useState<Record<string, unknown>>({});
  const [signError, setSignError] = useState<Error>();

  return (
    <>
      <div {...divProps} onClick={() => setShow(true)}>
        {children}
      </div>
      <Modal
        centered={true}
        size="lg"
        show={show}
        onHide={() => {
          setShow(false);
          setStep("form");
        }}
      >
        <ModalHeader closeButton={true}>
          <div className="flex items-center gap-2">
            <Button
              className={clsx(step !== "sign" && "!w-[0px] overflow-hidden")}
              noPadding={true}
              size="sm"
              icon={<UilArrowLeft />}
              iconPlacement="left"
              appearance="gray-link"
              onClick={() => setStep("form")}
            />
            Wallet operation
          </div>
        </ModalHeader>

        {operation === AssetOperation.Transfer && (
          <WalletOperationsTransfer
            data={data}
            asset={asset}
            username={activeUser?.username ?? ""}
            showSubmit={step === "form"}
            onSubmit={(d) => {
              setData(d);
              setStep("sign");
            }}
          />
        )}
        <AnimatePresence>
          {step === "sign" && (
            <WalletOperationSign
              data={data}
              asset={asset}
              operation={operation}
              onSignSuccess={() => setStep("success")}
              onSignError={(error) => {
                setStep("error");
                setSignError(error);
              }}
            />
          )}
          {step === "error" && <WalletOperationError error={signError} />}
          {step === "success" && <WalletOperationSuccess />}
        </AnimatePresence>
      </Modal>
    </>
  );
}
