"use client";

import i18next from "i18next";
import { ManageKey } from "./manage-key";
import { Button } from "@/features/ui";
import { useState } from "react";
import { ManageKeysDialog } from "./manage-keys-dialog";
import { UilPlus } from "@tooni/iconscout-unicons-react";

export function ManageKeys() {
  const [showDialog, setShowDialog] = useState(false);
  const [initialRevokeKey, setInitialRevokeKey] = useState<string | undefined>();

  const handleOpenAdd = () => {
    setInitialRevokeKey(undefined);
    setShowDialog(true);
  };

  const handleOpenRevoke = (publicKey: string) => {
    setInitialRevokeKey(publicKey);
    setShowDialog(true);
  };

  const handleClose = () => {
    setShowDialog(false);
    setInitialRevokeKey(undefined);
  };

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
          onClick={handleOpenAdd}
        >
          {i18next.t("permissions.keys.add-key")}
        </Button>
      </div>

      <ManageKey keyName="owner" onRevoke={handleOpenRevoke} />
      <ManageKey keyName="active" onRevoke={handleOpenRevoke} />
      <ManageKey keyName="posting" onRevoke={handleOpenRevoke} />
      <ManageKey keyName="memo" onRevoke={handleOpenRevoke} />

      <ManageKeysDialog
        show={showDialog}
        onHide={handleClose}
        initialRevokeKey={initialRevokeKey}
      />
    </div>
  );
}
