import { Modal, ModalBody, ModalFooter, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { Entry } from "@/entities";
import useInterval from "react-use/lib/useInterval";
import { useEffect, useState } from "react";
import { Button } from "@ui/button";
import Link from "next/link";
import { makeEntryPath } from "@/utils";
import { UilCheck, UilMultiply, UilSpinner } from "@tooni/iconscout-unicons-react";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
  isCreating: boolean;
  isPublishFailed: boolean;
  entry?: Entry;
}

const MAX_ATTEMPTS = 3;

export function EditorPublishValidating({
  show,
  setShow,
  isCreating,
  entry,
  isPublishFailed
}: Props) {
  const { refetch, data, isSuccess } = EcencyEntriesCacheManagement.getEntryQueryByPath(
    entry?.author,
    entry?.permlink
  ).useClientQuery();

  const [attempts, setAttempts] = useState(0);

  useInterval(
    () => {
      if (!data) {
        refetch();
      }
      setAttempts(attempts + 1);
    },
    attempts < MAX_ATTEMPTS && !data ? 3000 : null
  );

  useEffect(() => {
    setAttempts(0);
  }, [isPublishFailed]);

  return (
    <Modal centered={true} show={show} onHide={() => setShow(false)}>
      <ModalHeader closeButton={true}>{i18next.t("submit.post-creating.title")}</ModalHeader>
      <ModalBody className="text-center text-lg p-6">
        <div className="flex flex-col items-center gap-4">
          {!isCreating && !isSuccess && (isPublishFailed || attempts === MAX_ATTEMPTS) && (
            <>
              <UilMultiply className="w-12 h-12 text-red" />
              <div className="text-red">{i18next.t("submit.post-creating.publish-failed")}</div>
            </>
          )}
          {isCreating && (
            <>
              <UilSpinner className="w-12 h-12 animate-spin text-blue-dark-sky" />
              <div className="text-blue-dark-sky">
                {i18next.t("submit.post-creating.creating-process")}
              </div>
            </>
          )}
          {!isCreating && entry && !data && attempts < MAX_ATTEMPTS && (
            <>
              <UilSpinner className="w-12 h-12 animate-spin text-blue-dark-sky" />
              <div className="text-blue-dark-sky">
                {i18next.t("submit.post-creating.validating-process")}
              </div>
            </>
          )}
          {isSuccess && data && (
            <>
              <UilCheck className="w-12 h-12 text-green" />
              <div className="text-green">{i18next.t("submit.post-creating.success")}</div>
            </>
          )}
        </div>
      </ModalBody>
      <ModalFooter className="flex justify-center p-4">
        {isSuccess && data && (
          <Link href={makeEntryPath(data.category, data.author, data.permlink)}>
            <Button>{i18next.t("submit.post-creating.see")}</Button>
          </Link>
        )}
      </ModalFooter>
    </Modal>
  );
}
