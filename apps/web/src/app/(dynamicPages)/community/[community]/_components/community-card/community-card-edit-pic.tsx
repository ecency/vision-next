"use client";

import React, { useCallback, useState } from "react";
import { Tooltip } from "@ui/tooltip";
import i18next from "i18next";
import { pencilOutlineSvg } from "@ui/svg";
import { ImageUploadDialog } from "./community-image-upload-dialog";
import { FullAccount } from "@/entities";
import { useUpdateProfile } from "@/api/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { QueryKeys } from "@ecency/sdk";

interface EditPicProps {
  account: FullAccount;
  onUpdate: (url: string) => void;
}

export function CommunityCardEditPic({ account, onUpdate }: EditPicProps) {
  const [dialog, setDialog] = useState(false);

  const { mutateAsync: updateProfile, isPending } = useUpdateProfile(account);
  const qc = useQueryClient();

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

      // Invalidate account query to refresh profile data
      qc.invalidateQueries({
        queryKey: QueryKeys.accounts.full(account.name)
      });

      setDialog(false);
      onUpdate(url);
    },
    [
      account,
      dialog,
      onUpdate,
      qc,
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
