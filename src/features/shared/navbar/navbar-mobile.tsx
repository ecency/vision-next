import { useClientActiveUser } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { UserAvatar } from "@/features/shared";
import { NavbarMainSidebar } from "@/features/shared/navbar/navbar-main-sidebar";
import { NavbarMainSidebarToggle } from "@/features/shared/navbar/navbar-main-sidebar-toggle";
import { NavbarSide } from "@/features/shared/navbar/sidebar/navbar-side";
import {
  UilEditAlt,
  UilHome,
  UilHomeAlt,
  UilLock,
  UilWallet,
  UilWater
} from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import clsx from "clsx";
import i18next from "i18next";

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
  const toggleUIProp = useGlobalStore((state) => state.toggleUiProp);

  return (
    <div
      className={clsx(
        "flex items-center justify-between bg-white/80 dark:bg-dark-200/80 backdrop-blur-sm md:hidden m-2 rounded-xl p-3",
        "shadow-sm border border-[--border-color]",
        step === 1 && "transparent"
      )}
    >
      <Button
        appearance="gray-link"
        icon={<UilHomeAlt width={20} height={20} />}
        onClick={() => setMainBarExpanded(true)}
      />

      <Button href="/waves" appearance="gray-link" icon={<UilWater width={20} height={20} />} />
      <Button href="/publish" appearance="gray-link" icon={<UilEditAlt width={20} height={20} />} />

      {activeUser && (
        <>
          <Button
            href={`/@${activeUser?.username}/wallet`}
            appearance="gray-link"
            icon={<UilWallet width={20} height={20} />}
          />
          <div onClick={() => setExpanded(true)}>
            <UserAvatar size="medium" username={activeUser.username} />
          </div>
        </>
      )}
      {!activeUser && (
        <Button
          className="btn-login"
          onClick={() => toggleUIProp("login")}
          size="sm"
          icon={<UilLock />}
        >
          {i18next.t("g.login")}
        </Button>
      )}

      {activeUser && <NavbarSide show={expanded} setShow={setExpanded} />}
      <NavbarMainSidebar
        setShow={setMainBarExpanded}
        show={mainBarExpanded}
        setStepOne={setStepOne}
      />
    </div>
  );
}
