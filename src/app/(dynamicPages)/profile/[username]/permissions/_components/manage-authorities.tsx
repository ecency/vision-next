"use client";

import { formatError, Revoke, RevokeHot, RevokeKc } from "@/api/operations";
import { useClientActiveUser } from "@/api/queries";
import { error, KeyOrHot, LinearProgress, UserAvatar } from "@/features/shared";
import { ProfilePreview } from "@/features/shared/profile-popover/profile-preview";
import { Popover } from "@/features/ui";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { PrivateKey } from "@hiveio/dhive";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/button";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { useState } from "react";

export function ManageAuthorities() {
  const activeUser = useClientActiveUser();

  const { data: accountData, refetch } = useQuery({
    ...getAccountFullQueryOptions(activeUser?.username!),
    select: (resp) => ({
      postingsAuths: resp.posting.account_auths as [string, number][],
      posting: resp.posting.key_auths[0],
      owner: resp.owner.key_auths[0],
      active: resp.active.key_auths[0],
      weight: resp.active.weight_threshold,
      memokey: resp.memo_key
    })
  });

  const [newPostingsAuthority, setNewPostingsAuthority] = useState<[string, number][]>([]);
  const [step, setStep] = useState(0);
  const [keyDialog, setKeyDialog] = useState(false);
  const [targetAccount, setTargetAccount] = useState("");
  const [inProgress, setInProgress] = useState(false);

  const toggleKeyDialog = () => {
    setKeyDialog(!keyDialog);
  };

  const handleRevoke = (account: string) => {
    setTargetAccount(account);
    setKeyDialog(true);
    setStep(1);
    setNewPostingsAuthority(accountData!.postingsAuths.filter((x: any) => x[0] !== account));
  };

  const onKey = async (key: PrivateKey) => {
    try {
      setInProgress(true);
      const resp = await Revoke(
        activeUser!.username,
        accountData!.weight,
        newPostingsAuthority,
        [accountData!.posting],
        accountData!.memokey,
        key
      );
      if (resp.id) {
        setKeyDialog(true);
        setStep(2);
      }
    } catch (err) {
      error(...formatError(err));
    } finally {
      setInProgress(false);
    }
  };

  const onHot = () => {
    RevokeHot(
      activeUser!.username,
      accountData!.weight,
      newPostingsAuthority,
      [accountData!.posting],
      accountData!.memokey
    );
    setKeyDialog(false);
  };

  const onKc = () => {
    RevokeKc(
      activeUser!.username,
      accountData!.weight,
      newPostingsAuthority,
      [accountData!.posting],
      accountData!.memokey
    );
  };

  const finish = () => {
    setKeyDialog(false);
    refetch();
  };

  const signkeyModal = () => {
    return (
      <>
        <div className="sign-dialog-header border-b border-[--border-color]">
          <div className="step-no">1</div>
          <div className="sign-dialog-titles">
            <div className="authority-main-title">{i18next.t("manage-authorities.sign-title")}</div>
            <div className="authority-sub-title">
              {i18next.t("manage-authorities.sign-sub-title")}
            </div>
          </div>
        </div>
        {inProgress && <LinearProgress />}
        <KeyOrHot
          inProgress={inProgress}
          onKey={onKey}
          onHot={() => {
            toggleKeyDialog();
            if (onHot) {
              onHot();
            }
          }}
          onKc={() => {
            toggleKeyDialog();
            if (onKc) {
              onKc();
            }
          }}
        />
        <p className="text-center">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setKeyDialog(false);
            }}
          >
            {i18next.t("g.back")}
          </a>
        </p>
      </>
    );
  };

  const successModal = () => {
    return (
      <>
        <div className="success-dialog-header border-b border-[--border-color]">
          <div className="step-no">2</div>
          <div className="success-dialog-titles">
            <div className="authority-main-title">{i18next.t("trx-common.success-title")}</div>
            <div className="authority-sub-title">{i18next.t("trx-common.success-sub-title")}</div>
          </div>
        </div>

        <div className="success-dialog-body">
          <div className="success-dialog-content">
            <span>
              {" "}
              {i18next.t("manage-authorities.success-message")}{" "}
              <a href={`https://ecency.com/@${targetAccount}`} target="_blank">
                {targetAccount}
              </a>{" "}
            </span>
          </div>
          <div className="flex justify-center">
            <span className="hr-6px-btn-spacer" />
            <Button onClick={finish}>{i18next.t("g.finish")}</Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {(accountData?.postingsAuths?.length ?? 0) > 0 && (
        <div className="rounded-xl bg-white bg-opacity-75">
          <div className="p-4 text-sm md:text-lg font-bold">Posting active sessions</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 lg:gap-4 px-4 pb-4">
            {accountData?.postingsAuths?.map(([account, weight], i) => (
              <div
                key={account}
                className="bg-gray-100 dark:bg-dark-200-075 border border-[--border-color] p-2 rounded-lg flex flex-col gap-4"
              >
                <Popover
                  behavior="hover"
                  useMobileSheet={true}
                  placement="bottom-start"
                  directContent={
                    <div className="notranslate relative hover:bg-gray-200 flex items-center gap-2 dark:hover:bg-gray-800 rounded-2xl pointer duration-300">
                      <UserAvatar username={account} size="medium" />
                      <div>
                        <div className="font-semibold text-blue-dark-sky">{account}</div>
                        <div className="text-sm">
                          <span className="opacity-50">
                            {i18next.t("manage-authorities.weight")}:{" "}
                          </span>
                          <span>{weight}</span>
                        </div>
                      </div>
                    </div>
                  }
                  customClassName="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-xl w-[320px]"
                >
                  <ProfilePreview username={account} />
                </Popover>

                <Button appearance="gray" onClick={() => handleRevoke(account)}>
                  {i18next.t("manage-authorities.revoke")}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {keyDialog && (
        <Modal
          show={true}
          centered={true}
          onHide={toggleKeyDialog}
          className="authorities-dialog"
          size="lg"
        >
          <ModalHeader closeButton={true} />
          <ModalBody>
            {step === 1 && signkeyModal()}
            {step === 2 && successModal()}
          </ModalBody>
        </Modal>
      )}
    </>
  );
}
