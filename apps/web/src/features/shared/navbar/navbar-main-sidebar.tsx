import {
  UilCloudComputing,
  UilColumns,
  UilCommentDots,
  UilCommentPlus,
  UilEditAlt,
  UilHome,
  UilListUl,
  UilTag,
  UilUsersAlt,
  UilUserSquare,
  UilWater
} from "@tooni/iconscout-unicons-react";
import { NavbarSideMainMenuItem } from "./sidebar/navbar-side-main-menu-item";
import pack from "../../../../package.json";
import { NavbarSideThemeSwitcher } from "@/features/shared/navbar/sidebar";
import { Button } from "@ui/button";
import i18next from "i18next";
import { closeSvg } from "@ui/svg";
import { SwitchLang } from "@/features/shared";
import { Search } from "@/features/shared/navbar/search";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ModalSidebar } from "@ui/modal/modal-sidebar";
import { EcencyConfigManager } from "@/config";
import defaults from "@/defaults";
import { useHydrated } from "@/api/queries";
import { useMattermostUnread } from "@/features/chat/mattermost-api";
import { useActiveAccount } from "@/core/hooks/use-active-account";

interface Props {
  show: boolean;
  setShow: (v: boolean) => void;
  setStepOne?: () => void;
}

export function NavbarMainSidebar({ show, setShow, setStepOne }: Props) {
  const router = useRouter();
  const { activeUser } = useActiveAccount();
  const hydrated = useHydrated();
  const { data: unread } = useMattermostUnread(Boolean(activeUser && hydrated));

  const onLogoClick = () => {
    if (
      "/" !== location.pathname ||
      location.pathname?.startsWith("/hot") ||
      location.pathname?.startsWith("/created") ||
      location.pathname?.startsWith("/trending")
    ) {
      router.push("/");
    }
    setStepOne?.();
  };

  return (
    <ModalSidebar setShow={setShow} show={show} placement="left">
      <div className="px-4 py-3 mt-[2px] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-[40px] w-[40px] shrink-0 cursor-pointer">
            <Image
              src={defaults.logo}
              alt="Logo"
              className="h-[40px] w-[40px]"
              onClick={onLogoClick}
              width={40}
              height={40}
            />
          </div>
          <NavbarSideThemeSwitcher />
        </div>
        <Button icon={closeSvg} size="sm" appearance="gray-link" onClick={() => setShow(false)} />
      </div>
      <div className="px-4 py-6 flex flex-col gap-0.5">
        <Search />
        <div className="h-4 w-full" />
        <NavbarSideMainMenuItem
          label={i18next.t("navbar.post")}
          onClick={() => {
            setShow(false);
          }}
          to="/publish"
          icon={<UilEditAlt size={16} />}
        />

        <hr className="my-2 border-[--border-color]" />

        <NavbarSideMainMenuItem
          label={i18next.t("navbar.home")}
          onClick={() => {
            setShow(false);
            onLogoClick();
          }}
          icon={<UilHome size={16} />}
        />

        <EcencyConfigManager.Conditional
          condition={({ visionFeatures }) => visionFeatures.decks.enabled}
        >
          <NavbarSideMainMenuItem
            label={i18next.t("navbar.waves")}
            to="/waves"
            onClick={() => setShow(false)}
            icon={<UilWater size={16} />}
          />
        </EcencyConfigManager.Conditional>

        <NavbarSideMainMenuItem
          label={i18next.t("navbar.discover")}
          to="/discover"
          onClick={() => setShow(false)}
          icon={<UilUsersAlt size={16} />}
        />
        <NavbarSideMainMenuItem
          label={i18next.t("navbar.communities")}
          to="/communities"
          onClick={() => setShow(false)}
          icon={<UilUserSquare size={16} />}
        />
        <NavbarSideMainMenuItem
          label={i18next.t("trending-tags.title")}
          to="/tags"
          onClick={() => setShow(false)}
          icon={<UilTag size={16} />}
        />
        <EcencyConfigManager.Conditional
          condition={({ visionFeatures }) => visionFeatures.chats.enabled}
        >
          <NavbarSideMainMenuItem
            label={i18next.t("navbar.chats")}
            to="/chats"
            onClick={() => setShow(false)}
            icon={<UilCommentDots size={16} />}
            badgeContent={unread?.truncated ? undefined : unread?.totalUnread || undefined}
            dot={unread?.truncated ? false : Boolean(unread?.totalMentions || unread?.totalDMs)}
          />
        </EcencyConfigManager.Conditional>
        <EcencyConfigManager.Conditional
          condition={({ visionFeatures }) => visionFeatures.decks.enabled}
        >
          <NavbarSideMainMenuItem
            label={i18next.t("navbar.decks")}
            to="/decks"
            onClick={() => setShow(false)}
            icon={<UilColumns size={16} />}
          />
        </EcencyConfigManager.Conditional>

        <NavbarSideMainMenuItem
          label={i18next.t("proposals.page-title")}
          to="/proposals"
          onClick={() => setShow(false)}
          icon={<UilCommentPlus size={16} />}
        />
        <NavbarSideMainMenuItem
          label={i18next.t("witnesses.page-title")}
          to="/witnesses"
          onClick={() => setShow(false)}
          icon={<UilCloudComputing size={16} />}
        />
        <NavbarSideMainMenuItem
          label={i18next.t("switch-lang.contributors")}
          to="/contributors"
          onClick={() => setShow(false)}
          icon={<UilListUl size={16} />}
        />

        <hr className="my-2 border-[--border-color]" />
        <div className="text-xs">
          <NavbarSideMainMenuItem
            label={i18next.t("entry-index.faq")}
            target="_blank"
            to="https://docs.ecency.com"
            onClick={() => setShow(false)}
          />
          <NavbarSideMainMenuItem
            label={i18next.t("entry-index.tos")}
            to="/terms-of-service"
            onClick={() => setShow(false)}
          />
          <NavbarSideMainMenuItem
            label={i18next.t("entry-index.pp")}
            to="/privacy-policy"
            onClick={() => setShow(false)}
          />
        </div>
        <div className="p-4 items-center flex justify-between">
          <span className="text-xs opacity-50">v{pack.version}</span>
          <SwitchLang onSelect={() => setShow(false)} />
        </div>
      </div>
    </ModalSidebar>
  );
}
