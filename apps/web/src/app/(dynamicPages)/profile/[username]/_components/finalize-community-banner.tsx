"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, success } from "@/features/shared";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input/form-controls";
import { isCommunity } from "@/utils";
import { formatError } from "@/api/format-error";
import {
  getCommunityQueryOptions,
  useSetCommunityRole,
  useUpdateCommunity
} from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilSpinner } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { ChangeEvent, useState } from "react";

interface Props {
  username: string;
}

export function FinalizeCommunityBanner({ username }: Props) {
  const { activeUser } = useActiveAccount();

  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const adapter = getWebBroadcastAdapter();
  const { mutateAsync: setRole } = useSetCommunityRole(username, username, { adapter });
  const { mutateAsync: updateCommunity } = useUpdateCommunity(username, username, { adapter });

  // Check if community exists on hivemind
  const { data: community, isLoading, isError } = useQuery({
    ...getCommunityQueryOptions(username, "", isCommunity(username)),
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  // Show if: this is a community account, user is logged in as this account, and either:
  // 1. Community doesn't exist on hivemind yet (community === null), or
  // 2. Community exists but has no admin team set up (only owner or empty team)
  const isMyProfile = activeUser?.username === username;
  const communityExists = community !== null && community !== undefined;
  const needsSetup = !communityExists ||
    (!community.team || community.team.length <= 1);
  if (!isMyProfile || !isCommunity(username) || isLoading || isError || !needsSetup || done) {
    return null;
  }

  const handleSubmit = async () => {
    if (!adminUsername.trim()) return;
    if (!communityExists && !title.trim()) return;

    setSubmitting(true);
    try {
      // Set admin role
      await setRole({ account: adminUsername.trim(), role: "admin" });

      // Only update props if community doesn't exist on hivemind yet
      if (!communityExists) {
        await updateCommunity({
          title: title.trim(),
          about: about.trim(),
          lang: "en",
          description: "",
          flag_text: "",
          is_nsfw: false
        });
      }

      success(i18next.t("communities-create.finalize-success"));
      setDone(true);
    } catch (e) {
      error(...formatError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="-mx-4 border-t border-[--border-color] p-4">
      <h3 className="text-sm font-semibold mb-1">
        {i18next.t("communities-create.finalize-title")}
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
        {i18next.t("communities-create.finalize-description")}
      </p>

      <div className="flex flex-col gap-2">
        {!communityExists && (
          <>
            <div>
              <label htmlFor="community-title" className="text-xs font-medium mb-1 block">
                {i18next.t("communities-create.title")}
              </label>
              <FormControl
                id="community-title"
                type="text"
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder={i18next.t("communities-create.title")}
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="community-about" className="text-xs font-medium mb-1 block">
                {i18next.t("communities-create.about")}
              </label>
              <FormControl
                id="community-about"
                type="textarea"
                value={about}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAbout(e.target.value)}
                placeholder={i18next.t("communities-create.about")}
                disabled={submitting}
              />
            </div>
          </>
        )}
        <div>
          <label htmlFor="community-admin-username" className="text-xs font-medium mb-1 block">
            {i18next.t("communities-create.finalize-admin-label")}
          </label>
          <FormControl
            id="community-admin-username"
            type="text"
            value={adminUsername}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setAdminUsername(e.target.value)}
            placeholder={i18next.t("communities-create.finalize-admin-hint")}
            disabled={submitting}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {i18next.t("communities-create.finalize-admin-hint")}
          </span>
        </div>
        <div>
          <Button
            size="sm"
            appearance="primary"
            disabled={submitting || !adminUsername.trim() || (!communityExists && !title.trim())}
            onClick={handleSubmit}
          >
            {submitting && <UilSpinner className="animate-spin w-4 h-4 mr-2" />}
            {i18next.t("communities-create.finalize-title")}
          </Button>
        </div>
      </div>
    </div>
  );
}
