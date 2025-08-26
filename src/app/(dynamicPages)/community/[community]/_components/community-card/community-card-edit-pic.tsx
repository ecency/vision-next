"use client";

import React, { useCallback, useState } from "react";
import { Tooltip } from "@ui/tooltip";
import i18next from "i18next";
import { pencilOutlineSvg } from "@ui/svg";
import { ImageUploadDialog } from "./community-image-upload-dialog";
import { FullAccount } from "@/entities";
import { useUpdateProfile } from "@/api/mutations";
import { useGlobalStore } from "@/core/global-store";

interface EditPicProps {
  account: FullAccount;
  onUpdate: (url: string) => void;
}

export function CommunityCardEditPic({ account, onUpdate }: EditPicProps) {
  const [dialog, setDialog] = useState(false);

  const { mutateAsync: updateProfile, isPending } = useUpdateProfile(account);
  const updateActiveUser = useGlobalStore((s) => s.updateActiveUser);

  const save = useCallback(
    async (url: string) => {
      if (account.profile?.profile_image === url) {
        setDialog(!dialog);
        return;
      }

      await updateProfile({
        nextProfile: {
          profile_image: url
        }
      });

      account.profile = { ...(account.profile || {}), profile_image: url };
      await updateActiveUser();

      setDialog(false);
      onUpdate(url);
    },
    [
      account,
      dialog,
      onUpdate,
      updateActiveUser,
      updateProfile
    ]
  );

  return (
    <>
      <Tooltip content={i18next.t("community-card.profile-image-edit")}>
        <div className="edit-button" onClick={() => setDialog(!dialog)}>
          {pencilOutlineSvg}
        </div>
      </Tooltip>
      {dialog && (
        <ImageUploadDialog
          title={i18next.t("community-card.profile-image")}
          defImage={account.profile?.profile_image || ""}
          inProgress={isPending}
          onDone={save}
          onHide={() => setDialog(!dialog)}
        />
      )}
    </>
  );
}
