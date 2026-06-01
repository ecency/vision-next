"use client";

import { useHydrated } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { UserAvatar, preloadLoginDialog } from "@/features/shared";
import { NavbarMainSidebar } from "@/features/shared/navbar/navbar-main-sidebar";
import { NavbarNotificationsButton } from "@/features/shared/navbar/navbar-notifications-button";
import { NavbarSide } from "@/features/shared/navbar/sidebar/navbar-side";
import { isInAppBrowser } from "@/utils";
import { useMattermostUnread } from "@/features/chat/mattermost-api";
import { UilBars, UilComment, UilHomeAlt, UilLock, UilPlusCircle } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import clsx from "clsx";
import i18next from "i18next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import defaults from "@/defaults";

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
  const { activeUser } = useActiveAccount();
  const hydrated = useHydrated();
  const toggleUIProp = useGlobalStore((s) => s.toggleUiProp);
  const { data: unread } = useMattermostUnread(Boolean(activeUser && hydrated));
  const pathname = usePathname();

  const [isInRn, setIsInRn] = useState(false);
  useEffect(() => {
    let inApp = false;
    try {
      inApp = isInAppBrowser();
    } catch {
      inApp = false;
    }
    setIsInRn(inApp);
    if (inApp) {
      document.body.classList.add("is-inapp-browser");
      return () => document.body.classList.remove("is-inapp-browser");
    }
  }, []);

  const isActive = (prefix: string) => !!pathname && pathname.startsWith(prefix);
  const activeClass = (prefix: string) =>
    isActive(prefix) ? "!bg-blue-duck-egg dark:!bg-gray-800 rounded-lg" : "rounded-lg";

  return (
    <>
      {/* Floating brand + browse/governance menu — compact, top-left only so it
          never costs a full row of vertical space on small screens. */}
      <div
        className={clsx(
          "fixed top-2 left-2 z-20 md:hidden flex items-center gap-1 rounded-xl p-1.5",
          "bg-white/80 dark:bg-dark-200/80 backdrop-blur-sm shadow-sm border border-[--border-color]",
          step === 1 && "transparent"
        )}
      >
        <Button
          appearance="gray-link"
          noPadding={true}
          icon={<UilBars width={20} height={20} />}
          onClick={() => setMainBarExpanded(true)}
          aria-label={i18next.t("navbar.toggle-menu")}
          aria-expanded={mainBarExpanded}
        />
        <Link href="/" className="flex items-center">
          {/* The image alt provides the link's accessible name (brand/home),
              distinct from the "Home" feed tab below. */}
          <Image src={defaults.logo} alt="Ecency" width={28} height={28} className="rounded" />
        </Link>
      </div>

      {/* Bottom primary tabs */}
      <div
        className={clsx(
          "flex items-center justify-around bg-white/80 dark:bg-dark-200/80 backdrop-blur-sm md:hidden mx-2 mt-2 rounded-xl p-3",
          "shadow-sm border border-[--border-color]",
          step === 1 && "transparent",
          isInRn && "mb-20"
        )}
        style={isInRn ? undefined : { marginBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
      >
        <Button
          href="/hot"
          appearance="gray-link"
          icon={<UilHomeAlt width={20} height={20} />}
          aria-label={i18next.t("navbar.home")}
          aria-current={isActive("/hot") ? "page" : undefined}
          className={activeClass("/hot")}
        />
        <div key={`mobile-chat-${activeUser?.username || "anon"}`} className="relative">
          <Button
            href="/chats"
            appearance="gray-link"
            icon={<UilComment width={20} height={20} />}
            aria-label={i18next.t("navbar.chats")}
            aria-current={isActive("/chats") ? "page" : undefined}
            className={activeClass("/chats")}
          />
          {!unread?.truncated && unread?.totalUnread ? (
            <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-black dark:text-white shadow">
              {unread.totalUnread}
            </span>
          ) : null}
        </div>
        <Button
          href="/publish"
          appearance="primary"
          icon={<UilPlusCircle width={22} height={22} />}
          aria-label={i18next.t("navbar.post")}
          aria-current={isActive("/publish") ? "page" : undefined}
        />

        {activeUser ? (
          <>
            <NavbarNotificationsButton />
            <button
              key={`mobile-avatar-${activeUser.username}`}
              type="button"
              onClick={() => setExpanded(true)}
              aria-label={i18next.t("user-menu.title", { defaultValue: "Open user menu" })}
              aria-expanded={expanded}
              className="cursor-pointer"
            >
              <UserAvatar size="medium" username={activeUser.username} />
            </button>
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
      </div>

      {activeUser && <NavbarSide key={`mobile-${activeUser.username}`} show={expanded} setShow={setExpanded} />}
      <NavbarMainSidebar setShow={setMainBarExpanded} show={mainBarExpanded} setStepOne={setStepOne} />
    </>
  );
}
