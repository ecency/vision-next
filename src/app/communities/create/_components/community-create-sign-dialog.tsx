import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import { KeyOrHot } from "@/features/shared";
import { useCallback, useEffect } from "react";
import { PrivateKey } from "@hiveio/dhive";
import i18next from "i18next";
import {
  useCreateCommunityByApi,
  useCreateCommunityByHivesigner,
  useCreateCommunityByKeychain
} from "@/api/mutations";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
  onSubmit: (code: string) => void;
  setProgress: (progress: string) => void;
  username: string;
  wif: string;
  fee: string;
  title: string;
  about: string;
}

export function CommunityCreateSignDialog({
  show,
  setShow,
  onSubmit,
  setProgress,
  username,
  wif,
  fee,
  title,
  about
}: Props) {
  const { mutateAsync: submitApi } = useCreateCommunityByApi();
  const { mutateAsync: submitKc, isPending } = useCreateCommunityByKeychain();
  const { mutateAsync: submitHs } = useCreateCommunityByHivesigner();

  const onApi = useCallback(
    async (creatorKey: PrivateKey) => {
      const code = await submitApi({ creatorKey, fee, wif, username });
      setShow(false);
      onSubmit(code);
    },
    [fee, submitApi, setShow, username, wif]
  );

  const onHs = useCallback(async () => {
    setShow(false);
    await submitHs({ title, about, fee, wif, username });
  }, [about, fee, setShow, submitHs, title, username, wif]);

  const onKc = useCallback(async () => {
    setShow(false);
    const code = await submitKc({ username, wif, fee });
    onSubmit(code);
  }, [fee, setShow, submitKc, username, wif]);

  useEffect(() => {
    setProgress(isPending ? i18next.t("communities-create.progress-account") : "");
  }, [isPending, setProgress]);

  return (
    <Modal
      show={show}
      centered={true}
      onHide={() => setShow(false)}
      className="community-key-modal"
    >
      <ModalHeader closeButton={true} />
      <ModalBody>
        <KeyOrHot
          inProgress={false}
          onKey={(key) => onApi(key)}
          onKc={() => onKc()}
          onHot={() => onHs()}
        />
      </ModalBody>
    </Modal>
  );
}
