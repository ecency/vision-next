import { useClientActiveUser } from "@/api/queries";
import {
  Button,
  FormControl,
  InputGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader
} from "@/features/ui";
import { useAccountRevokeKey } from "@ecency/sdk";
import { deriveHiveKeys, detectHiveKeyDerivation } from "@ecency/wallets";
import { PrivateKey, PublicKey } from "@hiveio/dhive";
import { UilLock } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useCallback, useState } from "react";

interface Props {
  revokingKey: string;
  show: boolean;
  setShow: (v: boolean) => void;
}

export function ManageKeyRevokeDialog({ revokingKey, show, setShow }: Props) {
  const activeUser = useClientActiveUser();

  const [key, setKey] = useState("");

  const { mutateAsync: revoke } = useAccountRevokeKey(activeUser?.username);

  const handleRevoke = useCallback(async () => {
    const currentKeyType = await detectHiveKeyDerivation(activeUser?.username!, key, "owner");
    let currentKey: PrivateKey;

    switch (currentKeyType) {
      case "bip44":
        currentKey = PrivateKey.from(deriveHiveKeys(key).owner);
        break;
      case "master-password":
        currentKey = PrivateKey.fromLogin(activeUser?.username!, key, "owner");
      default:
        currentKey = PrivateKey.from(key);
    }

    return revoke({
      currentKey,
      revokingKey: PublicKey.from(revokingKey)
    });
  }, [revokingKey, key, activeUser, revoke]);

  return (
    <Modal centered={true} show={show} onHide={() => setShow(false)}>
      <ModalHeader closeButton={true}>{i18next.t("permissions.revoke-key.title")}</ModalHeader>
      <ModalBody>
        <div className="text-sm opacity-75 mb-4">{i18next.t("permissions.revoke-key.hint")}</div>

        <InputGroup prepend={<UilLock />}>
          <FormControl
            value={key}
            type="password"
            autoFocus={true}
            autoComplete="off"
            placeholder={i18next.t("manage-authorities.placeholder")}
            onChange={(e) => setKey(e.target.value)}
          />
        </InputGroup>
      </ModalBody>
      <ModalFooter className="flex justify-end">
        <Button onClick={handleRevoke}>{i18next.t("g.continue")}</Button>
      </ModalFooter>
    </Modal>
  );
}
