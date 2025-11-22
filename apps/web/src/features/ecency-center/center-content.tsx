import { CenterTabs } from "@/features/ecency-center/center-tabs";
import { useMemo, useState } from "react";
import { CenterAnnouncements, CenterFaq } from "@/features/ecency-center/sections";
import i18next from "i18next";

export function CenterContent() {
  const [current, setCurrent] = useState("faq");

  const tabs = useMemo(
    () => [
      {
        title: i18next.t("center.faq"),
        key: "faq"
      },
      {
        title: i18next.t("center.news"),
        key: "announcements"
      }
    ],
    []
  );

  return (
    <div>
      <CenterTabs tabs={tabs} onSelect={setCurrent} />
      {current === "faq" && <CenterFaq />}
      {current === "announcements" && <CenterAnnouncements />}
    </div>
  );
}
