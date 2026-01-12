import { useActiveAccount } from "@/core/hooks/use-active-account";
import { AssetOperation } from "@ecency/wallets";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { HTMLProps, PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Button, Modal, ModalHeader } from "../ui";
import {
  WalletOperationError,
  WalletOperationLock,
  WalletOperationPowerDown,
  WalletOperationSign,
  WalletOperationsLpDelegate,
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
  to: string | undefined;
  initialData?: Record<string, unknown>;
}

export function WalletOperationsDialog({
  children,
  operation,
  asset,
  to,
  initialData: initialDataProp,
  ...divProps
}: PropsWithChildren<Props> & HTMLProps<HTMLDivElement>) {
  const { activeUser } = useActiveAccount();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"form" | "sign" | "success" | "error">("form");
  const initialData = useMemo(() => initialDataProp ?? {}, [initialDataProp]);
  const [data, setData] = useState<Record<string, unknown>>(initialData);
  const [signError, setSignError] = useState<Error>();

  useEffect(() => {
    if (!show) {
      setData(initialData);
      setSignError(undefined);
    }
  }, [initialData, show]);

  const [titleNamespace, titleKey, subTitleKey] = useMemo(() => {
    if (operation === AssetOperation.WithdrawRoutes) {
      return ["withdraw-routes", "title", "description"] as const;
    }

    const key =
      operation === AssetOperation.Transfer && asset === AssetOperation.Gift
        ? "transfer-title-point"
        : `${operation}-title`;

    return ["transfer", key, `${operation}-sub-title`] as const;
  }, [asset, operation]);

  return (
    <>
      <div
        {...divProps}
        onClick={() => {
          setData(initialData);
          setStep("form");
          setSignError(undefined);
          setShow(true);
        }}
      >
        {children}
      </div>
      <Modal
        centered={true}
        size="lg"
        show={show}
        onHide={() => {
          setShow(false);
          setStep("form");
          setData(initialData);
          setSignError(undefined);
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
              <div>{i18next.t(`${titleNamespace}.${titleKey}`)}</div>
              <div className="text-sm opacity-50">{i18next.t(`${titleNamespace}.${subTitleKey}`)}</div>
            </div>
          </div>
        </ModalHeader>

        {([
          AssetOperation.Transfer,
          AssetOperation.TransferToSavings,
          AssetOperation.PowerUp,
          AssetOperation.Gift,
          AssetOperation.Stake,
          AssetOperation.Unstake,
          AssetOperation.WithdrawFromSavings,
          AssetOperation.ClaimInterest,
          AssetOperation.Convert,
        ].includes(operation) ||
          (AssetOperation.Delegate === operation && asset !== "LP")) && (
          <WalletOperationsTransfer
            to={to}
            data={data}
            asset={asset}
            username={activeUser?.username ?? ""}
            operation={operation}
            showSubmit={step === "form"}
            showMemo={[
              AssetOperation.Transfer,
              AssetOperation.TransferToSavings,
              AssetOperation.WithdrawFromSavings,
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
        {[AssetOperation.Delegate].includes(operation) && asset === "LP" && (
          <WalletOperationsLpDelegate
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
        {[AssetOperation.LockLiquidity].includes(operation) && (
          <WalletOperationLock
            asset={asset}
            username={activeUser?.username ?? ""}
            showSubmit={step === "form"}
            onSubmit={() => {
              setData({ from: activeUser?.username });
              setStep("sign");
            }}
          />
        )}
        {[AssetOperation.PowerDown].includes(operation) && (
          <WalletOperationPowerDown
            asset={asset}
            username={activeUser?.username ?? ""}
            showSubmit={step === "form"}
            onSubmit={(formData) => {
              setData(formData);
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
          {step === "success" && <WalletOperationSuccess onClose={() => setShow(false)} />}
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
