"use client";

import React, { useEffect, useState } from "react";
import { NotificationsContent } from "@/features/shared/notifications/notifications-content";
import "./_index.scss";
import { useGlobalStore } from "@/core/global-store";
import { ModalSidebar } from "@ui/modal/modal-sidebar";
import { EcencyConfigManager } from "@/config";

export * from "./notification-list-item";

interface Props {
  openLinksInNewTab?: boolean;
}

export function NotificationsDialog({ openLinksInNewTab = false }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const showNotifications = useGlobalStore((state) => state.uiNotifications);
  const toggleUIProp = useGlobalStore((state) => state.toggleUiProp);

  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(showNotifications && !!activeUser);
  }, [showNotifications, activeUser]);

  return (
    <EcencyConfigManager.Conditional
      condition={({ visionFeatures }) => visionFeatures.notifications.enabled}
    >
      <ModalSidebar
        className="notifications-modal min-w-[90%] md:min-w-[32rem] [&_.ecency-sidebar]:overflow-hidden"
        show={show}
        setShow={(v) => {
          setShow(v);
          toggleUIProp("notifications", v);
        }}
        placement="right"
      >
        <NotificationsContent openLinksInNewTab={openLinksInNewTab} />
      </ModalSidebar>
    </EcencyConfigManager.Conditional>
  );
}
