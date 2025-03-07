"use client";

import { useGlobalStore } from "@/core/global-store";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import "./_index.scss";
import { Login } from "./login";

export function LoginDialog() {
  const toggleUIProp = useGlobalStore((state) => state.toggleUiProp);

  const hide = () => {
    toggleUIProp("login");
  };

  return (
    <Modal show={true} centered={true} onHide={hide} size="lg">
      <ModalHeader closeButton={true} />
      <ModalBody className="md:p-6">
        <Login />
      </ModalBody>
    </Modal>
  );
}
