import { Asset, AssetOperation } from "@ecency/wallets";
import { HTMLProps, PropsWithChildren, useState } from "react";
import { Modal, ModalBody, ModalHeader } from "../ui";
import { WalletOperationsTransfer } from "./operations";
import { useClientActiveUser } from "@/api/queries";

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

  return (
    <>
      <div {...divProps} onClick={() => setShow(true)}>
        {children}
      </div>
      <Modal centered={true} size="lg" show={show} onHide={() => setShow(false)}>
        <ModalHeader closeButton={true}>Wallet operation</ModalHeader>

        {operation === AssetOperation.Transfer && (
          <WalletOperationsTransfer asset={asset} username={activeUser?.username ?? ""} />
        )}
      </Modal>
    </>
  );
}
