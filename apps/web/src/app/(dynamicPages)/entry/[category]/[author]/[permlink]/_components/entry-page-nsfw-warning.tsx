"use client";

import i18next from "i18next";
import { useGlobalStore } from "@/core/global-store";
import { useRouter } from "next/navigation";
import { NsfwSignupMessage } from "@/features/i18n/nsfw-signup-message";
import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";
import { useContext } from "react";

export function EntryPageNsfwWarning() {
  const router = useRouter();

  const activeUser = useGlobalStore((s) => s.activeUser);

  const { setShowIfNsfw } = useContext(EntryPageContext);

  return (
    <div className="nsfw-warning">
      <div className="nsfw-title">
        <span className="nsfw-badge">NSFW</span>
      </div>
      <div className="nsfw-body">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setShowIfNsfw(true);
          }}
        >
          {i18next.t("nsfw.reveal")}
        </a>{" "}
        {i18next.t("g.or").toLowerCase()}{" "}
        {activeUser && (
          <>
            {i18next.t("nsfw.settings-1")}{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                router.push(`/@${activeUser?.username}/settings`);
              }}
            >
              {i18next.t("nsfw.settings-2")}
            </a>
            {"."}
          </>
        )}
        {!activeUser && (
          <>
            <NsfwSignupMessage />
            {"."}
          </>
        )}
      </div>
    </div>
  );
}
