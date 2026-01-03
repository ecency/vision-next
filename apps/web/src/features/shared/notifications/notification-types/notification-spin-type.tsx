import React, { ReactElement } from "react";
import i18next from "i18next";
import Link from "next/link";

interface Props {
  sourceLink: ReactElement;
  afterClick: () => void;
  openLinksInNewTab?: boolean;
}

export function NotificationSpinType({ sourceLink, afterClick, openLinksInNewTab }: Props) {
  return (
    <div className="item-content">
      <div className="first-line">
        {sourceLink}
        <Link href="/perks" target={openLinksInNewTab ? "_blank" : undefined} onClick={afterClick}>
          <span className="item-action">{i18next.t("notifications.spin-str")}</span>
        </Link>
      </div>
    </div>
  );
}
