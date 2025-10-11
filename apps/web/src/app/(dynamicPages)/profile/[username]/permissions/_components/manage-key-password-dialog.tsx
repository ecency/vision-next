import { useClientActiveUser } from "@/api/queries";
import { error } from "@/features/shared";
import {
  Button,
  KeyInput,
  KeyInputImperativeHandle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader
} from "@/features/ui";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { deriveHiveMasterPasswordKeys } from "@ecency/wallets";
import { cryptoUtils, PublicKey } from "@hiveio/dhive";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useCallback, useRef, useState } from "react";
import { useRevealedKeysStore } from "../_hooks";

interface Props {
  show: boolean;
  setShow: (v: boolean) => void;
}

export function ManageKeyPasswordDialog({ show, setShow }: Props) {
  const activeUser = useClientActiveUser();

  const keyInputRef = useRef<KeyInputImperativeHandle>(null);

  const { data } = useQuery({
    ...getAccountFullQueryOptions(activeUser?.username ?? ""),
    select: (resp) => ({
      publicKeys: {
        owner: resp.owner.key_auths[0],
        active: resp.active.key_auths[0],
        posting: resp.posting.key_auths[0],
        memo: resp.memo_key
      }
    })
  });
  const { updateKeys } = useRevealedKeysStore();

  const handleSubmit = useCallback(async () => {
    const { raw } = await keyInputRef.current!.handleSign();

    if (!raw.length) {
      error(i18next.t("manage-authorities.error-fields-required"));
      return;
    }

    try {
      PublicKey.fromString(raw);
      error(i18next.t("login.error-public-key"));
      return;
    } catch (e) {}

    if (cryptoUtils.isWif(raw)) {
      error(i18next.t("permissions.keys.error-private-key-reveal"));
    } else {
      const keys = deriveHiveMasterPasswordKeys(activeUser!.username, raw);

      if (!data?.publicKeys.owner.includes(keys.ownerPubkey)) {
        error(i18next.t("login.error-authenticate")); // enter master or active key
        return;
      }

      updateKeys(activeUser!.username, {
        [keys.ownerPubkey]: keys.owner,
        [keys.activePubkey]: keys.active,
        [keys.postingPubkey]: keys.posting,
        [keys.memoPubkey]: keys.memo
      });
    }

    setShow(false);
  }, [activeUser, data?.publicKeys, setShow, updateKeys]);

  return (
    <Modal show={show} onHide={() => setShow(false)} centered={true}>
      <ModalHeader closeButton={true}>{i18next.t("manage-authorities.password-title")}</ModalHeader>
      <ModalBody>
        <div className="text-sm opacity-75 mb-4">
          {i18next.t("manage-authorities.password-sub-title")}
        </div>

        <KeyInput ref={keyInputRef} autoFocus={true} autoComplete="off" />
      </ModalBody>
      <ModalFooter className="flex justify-end">
        <Button onClick={handleSubmit}>{i18next.t("g.continue")}</Button>
      </ModalFooter>
    </Modal>
  );
}
