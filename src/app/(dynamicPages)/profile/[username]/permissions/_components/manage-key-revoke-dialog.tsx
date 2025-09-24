import { useClientActiveUser } from "@/api/queries";
import {
  Button,
  KeyInput,
  KeyInputImperativeHandle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader
} from "@/features/ui";
import { useAccountRevokeKey } from "@ecency/sdk";
import { PublicKey } from "@hiveio/dhive";
import i18next from "i18next";
import { useCallback, useRef } from "react";

interface Props {
  revokingKey: string;
  show: boolean;
  setShow: (v: boolean) => void;
}

export function ManageKeyRevokeDialog({ revokingKey, show, setShow }: Props) {
  const activeUser = useClientActiveUser();

  const keyInputRef = useRef<KeyInputImperativeHandle>(null);

  const { mutateAsync: revoke } = useAccountRevokeKey(activeUser?.username);

  const handleRevoke = useCallback(async () => {
    const { privateKey } = await keyInputRef.current!.handleSign();

    return revoke({
      currentKey: privateKey,
      revokingKey: PublicKey.from(revokingKey)
    });
  }, [revoke, revokingKey]);

  return (
    <Modal centered={true} show={show} onHide={() => setShow(false)}>
      <ModalHeader closeButton={true}>{i18next.t("permissions.revoke-key.title")}</ModalHeader>
      <ModalBody>
        <div className="text-sm opacity-75 mb-4">{i18next.t("permissions.revoke-key.hint")}</div>

        <KeyInput ref={keyInputRef} />
      </ModalBody>
      <ModalFooter className="flex justify-end">
        <Button onClick={handleRevoke}>{i18next.t("g.continue")}</Button>
      </ModalFooter>
    </Modal>
  );
}
