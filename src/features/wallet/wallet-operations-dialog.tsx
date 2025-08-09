import { useClientActiveUser } from "@/api/queries";
import { AssetOperation } from "@ecency/wallets";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { HTMLProps, PropsWithChildren, useMemo, useState } from "react";
import { Button, Modal, ModalHeader } from "../ui";
import {
  WalletOperationError,
  WalletOperationPowerDown,
  WalletOperationSign,
  WalletOperationsTransfer,
  WalletOperationSuccess,
  WalletOperationWithdrawRoutes,
  WalletOperationWithdrawRoutesForm
} from "./operations";
import i18next from "i18next";
import { MarketSwapForm } from "../market";

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

  const [titleKey, subTitleKey] = useMemo(() => {
    const key =
      operation === AssetOperation.Transfer && asset === AssetOperation.Gift
        ? "transfer-title-point"
        : `${operation}-title`;

    return [key, `${operation}-sub-title`];
  }, [asset, operation]);

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
            <div className="font-normal">
              <div>{i18next.t(`transfer.${titleKey}`)}</div>
              <div className="text-sm opacity-50">{i18next.t(`transfer.${subTitleKey}`)}</div>
            </div>
          </div>
        </ModalHeader>

        {[
          AssetOperation.Transfer,
          AssetOperation.TransferToSavings,
          AssetOperation.PowerUp,
          AssetOperation.Delegate,
          AssetOperation.Gift
        ].includes(operation) && (
          <WalletOperationsTransfer
            data={data}
            asset={asset}
            username={activeUser?.username ?? ""}
            showSubmit={step === "form"}
            showMemo={[
              AssetOperation.Transfer,
              AssetOperation.TransferToSavings,
              AssetOperation.Delegate,
              AssetOperation.Gift
            ].includes(operation)}
            onSubmit={(d) => {
              setData(d);
              setStep("sign");
            }}
          />
        )}
        {[AssetOperation.Swap].includes(operation) && <MarketSwapForm />}
        {[AssetOperation.PowerDown].includes(operation) && (
          <WalletOperationPowerDown
            asset={asset}
            username={activeUser?.username ?? ""}
            showSubmit={step === "form"}
            onSubmit={() => {
              setData({ from: activeUser?.username });
              setStep("sign");
            }}
          />
        )}
        {operation === AssetOperation.WithdrawRoutes && step === "form" && (
          <WalletOperationWithdrawRoutesForm
            onSubmit={(formData) => {
              setData(formData);
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

        {operation === AssetOperation.WithdrawRoutes && (
          <WalletOperationWithdrawRoutes
            onDeleteRoute={(formData) => {
              setData({
                account: formData.account,
                percent: formData.percent,
                auto: formData.auto,
                from: activeUser?.username
              });
              setStep("sign");
            }}
          />
        )}
      </Modal>
    </>
  );
}
