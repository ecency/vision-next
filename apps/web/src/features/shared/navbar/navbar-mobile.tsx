"use client";

import { useHydrated } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { UserAvatar, preloadLoginDialog } from "@/features/shared";
import { NavbarMainSidebar } from "@/features/shared/navbar/navbar-main-sidebar";
import { NavbarNotificationsButton } from "@/features/shared/navbar/navbar-notifications-button";
import { NavbarSide } from "@/features/shared/navbar/sidebar/navbar-side";
import { useHideOnScroll } from "@/features/shared/navbar/use-hide-on-scroll";
import { searchIconSvg } from "@ui/icons";
import { isInAppBrowser } from "@/utils";
import { useMattermostUnread } from "@/features/chat/mattermost-api";
import { UilBars, UilComment, UilHomeAlt, UilLock, UilPlus, UilWater } from "@tooni/iconscout-unicons-react";
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
  const hidden = useHideOnScroll();

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
  // The Home tab links to /hot but represents the whole feed area, so it stays
  // active across the feed sorts and the root.
  const homeActive =
    pathname === "/" || isActive("/hot") || isActive("/trending") || isActive("/created");
  const activeClass = (active: boolean) =>
    active ? "!bg-blue-duck-egg dark:!bg-gray-800 rounded-lg" : "rounded-lg";

  return (
    <>
      {/* Full-width sticky top bar — brand + browse/governance menu (left) and
          search (right). Slides up out of view on scroll-down, reveals on
          scroll-up, like a mobile browser's own toolbar. */}
      <div
        className={clsx(
          "fixed top-0 left-0 right-0 z-20 md:hidden flex items-center justify-between gap-2 px-3 h-14",
          "bg-white/90 dark:bg-dark-200/90 backdrop-blur-sm border-b border-[--border-color]",
          "transition-transform duration-300 will-change-transform",
          hidden ? "-translate-y-full" : "translate-y-0",
          step === 1 && "transparent"
        )}
      >
        <div className="flex items-center gap-1">
          <Button
            appearance="gray-link"
            noPadding={true}
            icon={<UilBars width={22} height={22} />}
            onClick={() => setMainBarExpanded(true)}
            aria-label={i18next.t("navbar.toggle-menu")}
            aria-expanded={mainBarExpanded}
          />
          <Link href="/" className="flex items-center">
            {/* The image alt provides the link's accessible name (brand/home),
                distinct from the "Home" feed tab below. */}
            <Image src={defaults.logo} alt="Ecency" width={30} height={30} className="rounded" />
          </Link>
        </div>
        <Button
          href="/search"
          appearance="gray-link"
          icon={searchIconSvg}
          aria-label={i18next.t("navbar.search", { defaultValue: "Search" })}
        />
      </div>

      {/* Bottom primary tabs */}
      <div
        className={clsx(
          "flex items-center justify-around bg-white/80 dark:bg-dark-200/80 backdrop-blur-sm md:hidden mx-2 mt-2 rounded-xl p-3",
          "shadow-sm border border-[--border-color]",
          "transition-transform duration-300 will-change-transform",
          hidden && "translate-y-[200%]",
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
          aria-current={homeActive ? "page" : undefined}
          className={activeClass(homeActive)}
        />
        <Button
          href="/waves"
          appearance="gray-link"
          icon={<UilWater width={20} height={20} />}
          aria-label={i18next.t("navbar.waves")}
          aria-current={isActive("/waves") ? "page" : undefined}
          className={activeClass(isActive("/waves"))}
        />
        <div key={`mobile-chat-${activeUser?.username || "anon"}`} className="relative">
          <Button
            href="/chats"
            appearance="gray-link"
            icon={<UilComment width={20} height={20} />}
            aria-label={i18next.t("navbar.chats")}
            aria-current={isActive("/chats") ? "page" : undefined}
            className={activeClass(isActive("/chats"))}
          />
          {!unread?.truncated && unread?.totalUnread ? (
            <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-black dark:text-white shadow">
              {unread.totalUnread}
            </span>
          ) : null}
        </div>
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

      {/* Floating compose button (FAB), mirroring the native app's create action. */}
      <Button
        href="/publish"
        appearance="primary"
        noPadding={true}
        icon={<UilPlus width={26} height={26} />}
        aria-label={i18next.t("navbar.post")}
        aria-current={isActive("/publish") ? "page" : undefined}
        className={clsx(
          "md:hidden fixed right-4 z-20 h-14 w-14 !rounded-full flex items-center justify-center shadow-lg",
          "transition-transform duration-300",
          hidden && "translate-y-[200%]",
          step === 1 && "transparent"
        )}
        style={{ bottom: isInRn ? "7rem" : "calc(env(safe-area-inset-bottom) + 4.75rem)" }}
      />

      {activeUser && <NavbarSide key={`mobile-${activeUser.username}`} show={expanded} setShow={setExpanded} />}
      <NavbarMainSidebar setShow={setMainBarExpanded} show={mainBarExpanded} setStepOne={setStepOne} />
    </>
  );
}
