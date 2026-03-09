"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { KeyInput } from "@ui/input";
import i18next from "i18next";
import { PrivateKey } from "@hiveio/dhive";
import { resolveMemoKey } from "./memo-key-events";

interface MemoKeyRequest {
  purpose: "encrypt" | "decrypt";
}

export function MemoKeyDialog() {
  const [request, setRequest] = useState<MemoKeyRequest | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<MemoKeyRequest>).detail;
      setRequest(detail);
    };
    window.addEventListener("ecency-memo-key", handler);
    return () => window.removeEventListener("ecency-memo-key", handler);
  }, []);

  const handleClose = useCallback(() => {
    setRequest(null);
    resolveMemoKey(false);
  }, []);

  const handleKeySign = useCallback((privateKey: PrivateKey) => {
    setRequest(null);
    resolveMemoKey(privateKey.toString());
  }, []);

  if (!request) return null;

  const subtitle =
    request.purpose === "encrypt"
      ? i18next.t("transfer.memo-key-subtitle-encrypt")
      : i18next.t("transfer.memo-key-subtitle-decrypt");

  return (
    <Modal show={true} centered={true} onHide={handleClose}>
      <ModalHeader closeButton={true}>
        <ModalTitle>{i18next.t("transfer.memo-key-title")}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <p className="text-sm text-gray-600 mb-4">{subtitle}</p>
        <KeyInput onSign={handleKeySign} keyType="memo" />
      </ModalBody>
    </Modal>
  );
}
