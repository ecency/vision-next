"use client";

import { useGlobalStore } from "@/core/global-store";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import { useUnmount } from "react-use";
import "./_index.scss";
import { Login } from "./login";
import { LoginKc } from "./login-kc";

export function LoginDialog() {
  const loginKc = useGlobalStore((state) => state.loginKc);
  const toggleUIProp = useGlobalStore((state) => state.toggleUiProp);

  useUnmount(() => {
    if (loginKc) {
      toggleUIProp("loginKc");
    }
  });

  const hide = () => {
    toggleUIProp("login");

    if (loginKc) {
      toggleUIProp("loginKc");
    }
  };

  return (
    <Modal show={true} centered={true} onHide={hide} size="lg">
      <ModalHeader closeButton={true} />
      <ModalBody className="md:p-6">
        {!loginKc && <Login />}
        {loginKc && <LoginKc />}
      </ModalBody>
    </Modal>
  );
}
