"use client";

import { useClientActiveUser } from "@/api/queries";
import { error, KeyOrHot, UserAvatar } from "@/features/shared";
import { ProfilePreview } from "@/features/shared/profile-popover/profile-preview";
import { Popover } from "@/features/ui";
import { getAccountFullQueryOptions, useAccountRevokePosting } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/button";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { useCallback, useState } from "react";
import { shouldUseHiveAuth } from "@/utils/client";

export function ManageAuthorities() {
  const activeUser = useClientActiveUser();

  const { data: accountData } = useQuery({
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

  const [revokingAccount, setRevokingAccount] = useState("");
  const [keyDialog, setKeyDialog] = useState(false);

  const { mutateAsync: revoke, isPending } = useAccountRevokePosting(activeUser?.username, {
    onError: (err) => error((err as Error).message),
    onSuccess: () => setKeyDialog(false)
  });
  const useHiveAuth = shouldUseHiveAuth(activeUser?.username);

  const handleRevoke = useCallback((account: string) => {
    setKeyDialog(true);
    setRevokingAccount(account);
  }, []);

  return (
    <>
      {(accountData?.postingsAuths?.length ?? 0) > 0 && (
        <div className="rounded-xl bg-white/80 dark:bg-dark-200/90 text-gray-900 dark:text-white">
          <div className="p-4 text-sm md:text-lg font-bold">
            {i18next.t("permissions.sessions.title")}
          </div>
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

                <Button size="sm" appearance="gray" onClick={() => handleRevoke(account)}>
                  {i18next.t("manage-authorities.revoke")}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        show={keyDialog}
        centered={true}
        onHide={() => setKeyDialog(false)}
        className="authorities-dialog"
        size="lg"
      >
        <ModalHeader closeButton={true}>{i18next.t("manage-authorities.sign-title")}</ModalHeader>
        <ModalBody>
          <KeyOrHot
            inProgress={isPending}
            onKey={(key) => revoke({ type: "key", accountName: revokingAccount, key })}
            onHot={() => revoke({ type: "hivesigner", accountName: revokingAccount })}
            onKc={() =>
              revoke({
                type: useHiveAuth ? "hiveauth" : "keychain",
                accountName: revokingAccount
              })
            }
          />
        </ModalBody>
      </Modal>
    </>
  );
}
