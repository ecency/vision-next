"use client";

import i18next from "i18next";
import { ManageKey } from "./manage-key";
import { Button, Modal, ModalBody, ModalHeader } from "@/features/ui";
import { useState } from "react";
import { ManageKeysAddKeys } from "./manage-keys-add-keys";
import { UilPlus } from "@tooni/iconscout-unicons-react";

export function ManageKeys() {
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-4 rounded-xl p-4 bg-white/80 dark:bg-dark-200/90 text-gray-900 dark:text-white pb-4">
      <div className="md:col-span-2 flex justify-between gap-4">
        <div>
          <div className="text-sm md:text-lg font-bold pb-1">
            {i18next.t("permissions.keys.title")}
          </div>

          <div className="text-sm opacity-75">{i18next.t("permissions.keys.hint")}</div>
        </div>

        <Button
          appearance="gray"
          size="sm"
          className="whitespace-nowrap"
          icon={<UilPlus />}
          onClick={() => setShowChangePassword(true)}
        >
          {i18next.t("permissions.keys.add-key")}
        </Button>
      </div>

      <ManageKey keyName="owner" />
      <ManageKey keyName="active" />
      <ManageKey keyName="posting" />
      <ManageKey keyName="memo" />

      <Modal show={showChangePassword} onHide={() => setShowChangePassword(false)} centered={true}>
        <ModalHeader closeButton={true}>{i18next.t("password-update.title")}</ModalHeader>
        <ModalBody>
          <ManageKeysAddKeys onSuccess={() => setShowChangePassword(false)} />
        </ModalBody>
      </Modal>
    </div>
  );
}
