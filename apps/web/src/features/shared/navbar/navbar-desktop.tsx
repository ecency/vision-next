import { useGlobalStore } from "@/core/global-store";
import { UserAvatar } from "@/features/shared";
import { AnonUserButtons } from "@/features/shared/navbar/anon-user-buttons";
import { NavbarMainSidebar } from "@/features/shared/navbar/navbar-main-sidebar";
import { NavbarMainSidebarToggle } from "@/features/shared/navbar/navbar-main-sidebar-toggle";
import { NavbarNotificationsButton } from "@/features/shared/navbar/navbar-notifications-button";
import { NavbarPerksButton } from "@/features/shared/navbar/navbar-perks-button";
import { Search } from "@/features/shared/navbar/search";
import { NavbarSide } from "@/features/shared/navbar/sidebar/navbar-side";
import { UilComment, UilEditAlt, UilQuestionCircle } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { Tooltip } from "@ui/tooltip";
import { classNameObject } from "@ui/util";
import i18next from "i18next";
import { useState } from "react";
import { NavbarTextMenu } from "./navbar-text-menu";
import { useClientActiveUser, useHydrated } from "@/api/queries";
import { useMattermostUnread } from "@/features/chat/mattermost-api";

interface Props {
  step?: number;
  transparentVerify: boolean;
  setStepOne?: () => void;
  setSmVisible: (v: boolean) => void;
  mainBarExpanded: boolean;
  setMainBarExpanded: (v: boolean) => void;
  experimental?: boolean; // Use this flag for testing something
}

export function NavbarDesktop({
  step,
  transparentVerify,
  setStepOne,
  mainBarExpanded,
  setMainBarExpanded,
  experimental = false
}: Props) {
  const activeUser = useClientActiveUser();
  const hydrated = useHydrated();
  const toggleUIProp = useGlobalStore((state) => state.toggleUiProp);
  const uiNotifications = useGlobalStore((state) => state.uiNotifications);
  const { data: unread } = useMattermostUnread(Boolean(activeUser && hydrated));

  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div
      className={`hidden md:flex w-full select-none relative ${
        !transparentVerify && step === 1 ? "transparent" : ""
      } `}
    >
      <div
        className={classNameObject({
          "ecency-navbar-desktop max-w-[1600px] w-full mx-auto flex items-center justify-between px-4 py-3":
            true,
          "bg-white dark:bg-dark-700 border-b border-[--border-color]": !experimental,
          "ecency-navbar-desktop-experemental glass-box rounded-2xl bg-white/80 dark:bg-dark-200/80 backdrop-blur-sm dark:backdrop-blur-md":
            experimental,
          transparent: !transparentVerify && step === 1
        })}
      >
        <NavbarMainSidebarToggle onClick={() => setMainBarExpanded(true)} />
        <div className="flex-1" />
        <NavbarTextMenu />
        <div className="flex-spacer" />
        <Tooltip content="FAQ and documetation">
          <Button
            className="after:!hidden"
            href="https://docs.ecency.com"
            target="_blank"
            icon={<UilQuestionCircle />}
            appearance="gray-link"
          />
        </Tooltip>
        {(step !== 1 || transparentVerify) && (
          <div className="max-w-[400px] w-full">
            <Search />
          </div>
        )}
        <div className="flex items-center ml-3 gap-3">
          <NavbarPerksButton />
          <Tooltip content={i18next.t("chat.title")}>
            <div key={activeUser?.username || "anon"} className="relative">
              <Button
                href="/chats"
                appearance="gray-link"
                className="relative"
                icon={<UilComment width={20} height={20} />}
              />
              {unread?.totalUnread ? (
                <span className="navbar-chat-badge notranslate">
                  {unread.totalUnread}
                </span>
              ) : null}
            </div>
          </Tooltip>
          <Tooltip content={i18next.t("navbar.post")}>
            <Button
              href="/publish"
              appearance="gray-link"
              icon={<UilEditAlt width={20} height={20} />}
            />
          </Tooltip>
          {hydrated && activeUser && (
            <NavbarNotificationsButton key={activeUser.username} />
          )}
        </div>
        <div className="btn-menu">
          <AnonUserButtons />
          {hydrated && activeUser && (
            <div
              key={activeUser.username}
              className="cursor-pointer ml-4"
              onClick={() => {
                setShowSidebar(true);
                if (uiNotifications) {
                  toggleUIProp("notifications");
                }
              }}
            >
              <UserAvatar size="medium" username={activeUser.username} />
            </div>
          )}
        </div>
      </div>
      {hydrated && activeUser && (
        <NavbarSide key={activeUser.username} show={showSidebar} setShow={setShowSidebar} />
      )}
      <NavbarMainSidebar
        show={mainBarExpanded}
        setShow={setMainBarExpanded}
        setStepOne={setStepOne}
      />
    </div>
  );
}
