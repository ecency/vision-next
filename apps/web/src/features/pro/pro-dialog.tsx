"use client";

import { Alert } from "@ui/alert";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { useState } from "react";
import { ProCheckout } from "./pro-checkout";

interface Props {
  /** The authenticated buyer. */
  username: string;
  onHide: () => void;
}

/**
 * Ecency Pro purchase dialog. Dynamically imported from the perks hub (ssr:false) so
 * @stripe/stripe-js stays out of the perks bundle until the user opens it.
 */
export function ProDialog({ username, onHide }: Props) {
  const [done, setDone] = useState(false);

  return (
    <Modal show={true} centered={true} onHide={onHide} size="md">
      <ModalHeader closeButton={true}>{i18next.t("pro.title")}</ModalHeader>
      <ModalBody>
        {done ? (
          <Alert appearance="success">
            <div className="flex flex-col gap-1">
              <strong>{i18next.t("pro.success-title")}</strong>
              <span>{i18next.t("pro.success-body")}</span>
            </div>
          </Alert>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="opacity-75 text-sm">{i18next.t("pro.subtitle")}</p>
            <ul className="text-sm flex flex-col gap-1 list-disc pl-5">
              <li>{i18next.t("pro.benefit-badge")}</li>
              <li>{i18next.t("pro.benefit-support")}</li>
              <li>{i18next.t("pro.benefit-early")}</li>
            </ul>
            <ProCheckout
              username={username}
              returnUrl={typeof window !== "undefined" ? window.location.href : ""}
              onActivated={() => setDone(true)}
            />
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}

export default ProDialog;
