"use client";

import { PurchaseTypes } from "./purchase-types";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { PurchaseQrBuilder } from "@/features/shared";
import i18next from "i18next";

export * from "./purchase-qr-types";
export * from "./purchase-types";

interface Props {
  show: boolean;
  setShow?: (val: boolean) => void;
  type?: PurchaseTypes;
}

export const PurchaseQrDialog = ({ show, setShow, type }: Props) => {
  return (
    <Modal
      show={show}
      centered={true}
      onHide={() => setShow?.(false)}
      className="purchase-qr-dialog"
      size="lg"
    >
      <ModalHeader closeButton={true}>
        <ModalTitle>
          {type === PurchaseTypes.POINTS
            ? i18next.t("purchase-qr.title-points")
            : i18next.t("purchase-qr.title")}
        </ModalTitle>
      </ModalHeader>
      <ModalBody>
        <PurchaseQrBuilder queryType={type || PurchaseTypes.BOOST} />
      </ModalBody>
    </Modal>
  );
};
