"use client";

import i18next from "i18next";
import { ManageKey } from "./manage-key";
import { Button, Modal, ModalBody, ModalHeader } from "@/features/ui";
import { useState } from "react";
import { ManageKeysAddKeys } from "./manage-keys-add-keys";
import { UilPlus } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { ManageKeyChangePassword } from "./manage-keys-change-password";

export function ManageKeys() {
  const [tab, setTab] = useState<"password" | "key">("password");
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-4 rounded-xl p-4 bg-white/80 dark:bg-dark-200/90 text-gray-900 dark:text-white pb-4">
      <div className="md:col-span-2 flex justify-between gap-4">
        <div>
          <div className="flex gap-1 mb-4">
            <div
              className={clsx(
                "cursor-pointer text-sm font-semibold rounded-full px-2 py-1",
                tab === "password" && "bg-gray-100 dark:bg-gray-100/10 "
              )}
              onClick={() => setTab("password")}
            >
              {i18next.t("permissions.change-password.title")}
            </div>
            <div
              className={clsx(
                "cursor-pointer text-sm font-semibold rounded-full px-2 py-1",
                tab === "key" && "bg-gray-100 dark:bg-gray-100/10 "
              )}
              onClick={() => setTab("key")}
            >
              {i18next.t("permissions.keys.title")}
            </div>
          </div>
          <div
            className="text-sm opacity-75"
            dangerouslySetInnerHTML={{
              __html:
                tab === "password"
                  ? i18next.t("permissions.change-password.hint")
                  : i18next.t("permissions.keys.hint")
            }}
          />
        </div>

        {tab === "key" && (
          <Button
            appearance="gray"
            size="sm"
            className="whitespace-nowrap"
            icon={<UilPlus />}
            onClick={() => setShowChangePassword(true)}
          >
            {i18next.t("permissions.keys.add-key")}
          </Button>
        )}
      </div>

      {tab === "password" && <ManageKeyChangePassword />}
      {tab === "key" && (
        <>
          <ManageKey keyName="owner" />
          <ManageKey keyName="active" />
          <ManageKey keyName="posting" />
          <ManageKey keyName="memo" />

          <Modal
            show={showChangePassword}
            onHide={() => setShowChangePassword(false)}
            centered={true}
          >
            <ModalHeader closeButton={true}>{i18next.t("password-update.title")}</ModalHeader>
            <ModalBody>
              <ManageKeysAddKeys onSuccess={() => setShowChangePassword(false)} />
            </ModalBody>
          </Modal>
        </>
      )}
    </div>
  );
}
