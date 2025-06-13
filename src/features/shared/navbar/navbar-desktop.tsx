import { useGlobalStore } from "@/core/global-store";
import { UserAvatar } from "@/features/shared";
import { AnonUserButtons } from "@/features/shared/navbar/anon-user-buttons";
import { NavbarMainSidebar } from "@/features/shared/navbar/navbar-main-sidebar";
import { NavbarMainSidebarToggle } from "@/features/shared/navbar/navbar-main-sidebar-toggle";
import { NavbarNotificationsButton } from "@/features/shared/navbar/navbar-notifications-button";
import { NavbarPerksButton } from "@/features/shared/navbar/navbar-perks-button";
import { Search } from "@/features/shared/navbar/search";
import { NavbarSide } from "@/features/shared/navbar/sidebar/navbar-side";
import { UilEditAlt, UilQuestionCircle } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { Tooltip } from "@ui/tooltip";
import { classNameObject } from "@ui/util";
import i18next from "i18next";
import { useState } from "react";
import { NavbarTextMenu } from "./navbar-text-menu";
import {useClientActiveUser} from "@/api/queries";

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
  const toggleUIProp = useGlobalStore((state) => state.toggleUiProp);
  const uiNotifications = useGlobalStore((state) => state.uiNotifications);

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
          "rounded-2xl bg-white dark:bg-dark-200 md:border border-[--border-color]": experimental,
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
        <div className="flex items-center ml-3">
          <NavbarPerksButton />
          <Tooltip content={i18next.t("navbar.post")}>
            <Button
              href="/publish"
              appearance="gray-link"
              className="ml-3"
              icon={<UilEditAlt width={20} height={20} />}
            />
          </Tooltip>
          {activeUser && <NavbarNotificationsButton />}
        </div>
        <div className="btn-menu">
          <AnonUserButtons />
          {activeUser && (
            <div
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
      {activeUser && <NavbarSide show={showSidebar} setShow={setShowSidebar} />}
      <NavbarMainSidebar
        show={mainBarExpanded}
        setShow={setMainBarExpanded}
        setStepOne={setStepOne}
      />
    </div>
  );
}
