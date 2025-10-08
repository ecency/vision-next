import React, { useState } from "react";
import { dotsMenuIconSvg, walletIconSvg } from "../icons";
import { Button } from "@ui/button";
import { useGlobalStore } from "@/core/global-store";
import { useNotificationUnreadCountQuery } from "@/api/queries";
import { bellSvg, rocketSvg } from "@ui/svg";
import { NavbarMainSidebar } from "@/features/shared/navbar/navbar-main-sidebar";
import { WalletBadge } from "@/features/shared";
import { EcencyConfigManager } from "@/config";

interface Props {
  setShowPurchaseDialog: (v: boolean) => void;
}

export const DeckToolbarBaseActions = ({ setShowPurchaseDialog }: Props) => {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const toggleUIProp = useGlobalStore((s) => s.toggleUiProp);

  const { data: unread } = useNotificationUnreadCountQuery();

  const [showMainSide, setShowMainSide] = useState(false);

  return (
    <div className="base-actions">
      {activeUser && (
        <>
          <EcencyConfigManager.Conditional
            condition={({ visionFeatures }) => visionFeatures.notifications.enabled}
          >
            <div className="notifications" onClick={() => toggleUIProp("notifications")}>
              {unread > 0 && (
                <span className="notifications-badge notranslate">
                  {unread.toString().length < 3 ? unread : "..."}
                </span>
              )}
              {bellSvg}
            </div>
          </EcencyConfigManager.Conditional>
          <EcencyConfigManager.Conditional
            condition={({ visionFeatures }) => visionFeatures.perks.enabled}
          >
            <div onClick={() => setShowPurchaseDialog(true)}>{rocketSvg}</div>
          </EcencyConfigManager.Conditional>
          <WalletBadge icon={walletIconSvg} />
        </>
      )}
      <Button appearance="link" onClick={() => setShowMainSide(true)} style={{ height: "56px" }}>
        {dotsMenuIconSvg}
      </Button>
      <NavbarMainSidebar show={showMainSide} setShow={setShowMainSide} />
    </div>
  );
};
