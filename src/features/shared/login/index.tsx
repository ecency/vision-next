"use client";

import { useGlobalStore } from "@/core/global-store";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import { useRef } from "react";
import { useUnmount } from "react-use";
import "./_index.scss";
import { Login } from "./login";
import { LoginKc } from "./login-kc";

export function LoginDialog() {
  const userListRef = useRef();

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
    <Modal show={true} centered={true} onHide={hide} className="login-modal">
      <ModalHeader thin={true} closeButton={true} />
      <ModalBody>
        {!loginKc && (
          // eslint-disable-next-line react/jsx-no-undef
          <Login userListRef={userListRef} />
        )}
        {loginKc && <LoginKc />}
      </ModalBody>
    </Modal>
  );
}
