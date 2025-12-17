"use client";

import { useClientActiveUser, useHydrated } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { UserAvatar, preloadLoginDialog } from "@/features/shared";
import { NavbarMainSidebar } from "@/features/shared/navbar/navbar-main-sidebar";
import { NavbarMainSidebarToggle } from "@/features/shared/navbar/navbar-main-sidebar-toggle";
import { NavbarSide } from "@/features/shared/navbar/sidebar/navbar-side";
import { isKeychainInAppBrowser } from "@/utils";
import { useMattermostUnread } from "@/features/chat/mattermost-api";
import { UilComment, UilEditAlt, UilHomeAlt, UilLock, UilWallet, UilWater } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import clsx from "clsx";
import i18next from "i18next";
import { useEffect, useState } from "react";

interface Props {
  step?: number;
  setStepOne?: () => void;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  mainBarExpanded: boolean;
  setMainBarExpanded: (v: boolean) => void;
}

export function NavbarMobile({
  step,
  setStepOne,
  expanded,
  setExpanded,
  mainBarExpanded,
  setMainBarExpanded
}: Props) {
  const activeUser = useClientActiveUser();
  const hydrated = useHydrated();
  const toggleUIProp = useGlobalStore((s) => s.toggleUiProp);
  const { data: unread } = useMattermostUnread(Boolean(activeUser && hydrated));

  const [isInRn, setIsInRn] = useState(false);
  useEffect(() => {
    try {
      setIsInRn(isKeychainInAppBrowser());
    } catch {
      setIsInRn(false);
    }
  }, []);

  return (
    <div
      className={clsx(
        "flex items-center justify-between bg-white/80 dark:bg-dark-200/80 backdrop-blur-sm md:hidden m-2 rounded-xl p-3",
        "shadow-sm border border-[--border-color]",
        step === 1 && "transparent",
        isInRn && "mb-20"
      )}
    >
      <Button
        appearance="gray-link"
        icon={<UilHomeAlt width={20} height={20} />}
        onClick={() => setMainBarExpanded(true)}
      />
      <Button href="/waves" appearance="gray-link" icon={<UilWater width={20} height={20} />} />
      <div key={activeUser?.username || "anon"} className="relative">
        <Button href="/chats" appearance="gray-link" icon={<UilComment width={20} height={20} />} />
        {unread?.totalUnread ? (
          <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-black dark:text-white shadow">
            {unread.totalUnread}
          </span>
        ) : null}
      </div>
      <Button href="/publish" appearance="gray-link" icon={<UilEditAlt width={20} height={20} />} />

      {activeUser ? (
        <>
          <Button
            href={`/@${activeUser.username}/wallet`}
            appearance="gray-link"
            icon={<UilWallet width={20} height={20} />}
          />
          <div key={activeUser.username} onClick={() => setExpanded(true)}>
            <UserAvatar size="medium" username={activeUser.username} />
          </div>
        </>
      ) : (
        <Button
          className="btn-login"
          onClick={() => toggleUIProp("login")}
          onMouseEnter={preloadLoginDialog}
          onFocus={preloadLoginDialog}
          onPointerDown={preloadLoginDialog}
          size="sm"
          icon={<UilLock />}
        >
          {i18next.t("g.login")}
        </Button>
      )}

      {activeUser && <NavbarSide key={activeUser.username} show={expanded} setShow={setExpanded} />}
      <NavbarMainSidebar setShow={setMainBarExpanded} show={mainBarExpanded} setStepOne={setStepOne} />
    </div>
  );
}
