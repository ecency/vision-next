import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useGlobalStore } from "@/core/global-store";
import { Button, Popover, PopoverContent } from "@/features/ui";
import { useRef, useState } from "react";
import { NavbarSideMainMenuItem } from "./navbar-side-main-menu-item";
import i18next from "i18next";
import { UilSignout } from "@tooni/iconscout-unicons-react";
import { useClickAway } from "react-use";

export function NavbarSideMainLogout() {
  const ref = useRef<HTMLDivElement>(null);

  const { activeUser } = useActiveAccount();
  const setActiveUser = useGlobalStore((state) => state.setActiveUser);
  const deleteUser = useGlobalStore((state) => state.deleteUser);

  const [showLogoutPopover, setShowLogoutPopover] = useState(false);

  useClickAway(ref, () => showLogoutPopover && setShowLogoutPopover(false));

  return (
    <Popover
      show={showLogoutPopover}
      setShow={setShowLogoutPopover}
      directContent={
        <NavbarSideMainMenuItem
          label={i18next.t("user-nav.logout")}
          onClick={() => setShowLogoutPopover(!showLogoutPopover)}
          icon={<UilSignout size={16} />}
        />
      }
    >
      <div ref={ref}>
        <PopoverContent className="flex flex-col gap-2">
          <Button size="sm" appearance="gray" onClick={() => setActiveUser(null)}>
            {i18next.t("user-nav.just-logout")}
          </Button>
          <Button
            size="sm"
            appearance="danger"
            onClick={() => {
              const username = activeUser?.username;
              setActiveUser(null);
              deleteUser(username!);
            }}
          >
            {i18next.t("user-nav.logout-and-clear")}
          </Button>
        </PopoverContent>
      </div>
    </Popover>
  );
}
