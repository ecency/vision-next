import { EcencyConfigManager } from "@/config";
import { useGlobalStore } from "@/core/global-store";
import { BookmarksDialog } from "@/features/shared/bookmarks";
import { DraftsDialog } from "@/features/shared/drafts";
import { FragmentsDialog } from "@/features/shared/fragments";
import { GalleryDialog } from "@/features/shared/gallery";
import { preloadLoginDialog } from "@/features/shared";
import { SchedulesDialog } from "@/features/shared/schedules";
import {
  UilArchive,
  UilClock,
  UilDashboard,
  UilDocumentInfo,
  UilFavorite,
  UilImages,
  UilMoneyWithdraw,
  UilSetting,
  UilSignin,
  UilUser,
  UilWallet
} from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { ReactNode, useMemo, useState } from "react";
import { NavbarSideMainLogout } from "./navbar-side-main-logout";
import { NavbarSideMainMenuItem } from "./navbar-side-main-menu-item";

interface Props {
  onHide: () => void;
}

interface MenuItem {
  label: string;
  to?: string;
  icon?: ReactNode;
  onClick: () => void;
}

export function NavbarSideMainMenu({ onHide }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const toggleUIProp = useGlobalStore((state) => state.toggleUiProp);

  const [gallery, setGallery] = useState(false);
  const [drafts, setDrafts] = useState(false);
  const [bookmarks, setBookmarks] = useState(false);
  const [schedules, setSchedules] = useState(false);
  const [fragments, setFragments] = useState(false);

  const mainMenu = useMemo(
    () =>
      [
        {
          label: i18next.t("user-nav.profile"),
          to: `/@${activeUser?.username}`,
          icon: <UilUser size={16} />,
          onClick: () => onHide()
        },
        {
          label: i18next.t("user-nav.wallet"),
          to: `/@${activeUser?.username}/wallet`,
          icon: <UilWallet size={16} />,
          onClick: () => onHide()
        },
        ...EcencyConfigManager.composeConditionals(
          EcencyConfigManager.withConditional(
            ({ visionFeatures }) => visionFeatures.drafts.enabled,
            () => ({
              label: i18next.t("user-nav.drafts"),
              onClick: () => setDrafts(!drafts),
              icon: <UilDocumentInfo size={16} />
            })
          ),
          EcencyConfigManager.withConditional(
            ({ visionFeatures }) => visionFeatures.gallery.enabled,
            () => ({
              label: i18next.t("user-nav.gallery"),
              onClick: () => setGallery(!gallery),
              icon: <UilImages size={16} />
            })
          ),
          EcencyConfigManager.withConditional(
            ({ visionFeatures }) => visionFeatures.bookmarks.enabled,
            () => ({
              label: i18next.t("user-nav.bookmarks"),
              onClick: () => setBookmarks(!bookmarks),
              icon: <UilFavorite size={16} />
            })
          ),
          EcencyConfigManager.withConditional(
            ({ visionFeatures }) => visionFeatures.schedules.enabled,
            () => ({
              label: i18next.t("user-nav.schedules"),
              onClick: () => setSchedules(!schedules),
              icon: <UilClock size={16} />
            })
          ),
          EcencyConfigManager.withConditional(
            ({ visionFeatures }) => visionFeatures.fragments.enabled,
            () => ({
              label: i18next.t("user-nav.fragments"),
              onClick: () => setFragments(!fragments),
              icon: <UilArchive size={16} />
            })
          )
        ),
        {
          label: i18next.t("user-nav.settings"),
          to: `/@${activeUser?.username}/settings`,
          onClick: () => onHide(),
          icon: <UilSetting size={16} />
        }
      ] as MenuItem[],
    [activeUser?.username, bookmarks, drafts, fragments, gallery, onHide, schedules]
  );

  return (
    <>
      <div className="px-4 flex flex-col gap-0.5">
        {mainMenu.map(({ label, onClick, icon, to }) => (
          <NavbarSideMainMenuItem to={to} key={label} label={label} onClick={onClick} icon={icon} />
        ))}
        <hr className="my-2 border-[--border-color]" />
        <NavbarSideMainMenuItem
          label={i18next.t("market.swap-title")}
          to="/market/swap"
          onClick={onHide}
          icon={<UilMoneyWithdraw size={16} />}
        />
        <NavbarSideMainMenuItem
          label={i18next.t("market.advanced-title")}
          to="/market/advanced"
          onClick={onHide}
          icon={<UilDashboard size={16} />}
        />
        <hr className="my-2 border-[--border-color]" />
        <NavbarSideMainMenuItem
          label={i18next.t("g.login-as")}
          onClick={() => {
            preloadLoginDialog();
            toggleUIProp("login");
          }}
          onPointerEnter={preloadLoginDialog}
          onPointerDown={preloadLoginDialog}
          onFocus={preloadLoginDialog}
          icon={<UilSignin size={16} />}
        />
        <NavbarSideMainLogout />
      </div>
      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.gallery.enabled}
      >
        <GalleryDialog setShow={(v) => setGallery(v)} show={gallery} />
      </EcencyConfigManager.Conditional>

      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.drafts.enabled}
      >
        <DraftsDialog show={drafts} setShow={(v) => setDrafts(v)} />
      </EcencyConfigManager.Conditional>

      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.bookmarks.enabled}
      >
        <BookmarksDialog show={bookmarks && !!activeUser} setShow={(v) => setBookmarks(v)} />
      </EcencyConfigManager.Conditional>

      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.schedules.enabled}
      >
        <SchedulesDialog show={schedules && !!activeUser} setShow={(v) => setSchedules(v)} />
      </EcencyConfigManager.Conditional>

      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.fragments.enabled}
      >
        <FragmentsDialog show={fragments && !!activeUser} setShow={(v) => setFragments(v)} />
      </EcencyConfigManager.Conditional>
    </>
  );
}
