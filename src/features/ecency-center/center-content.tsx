import { CenterTabs } from "@/features/ecency-center/center-tabs";
import { useMemo, useState } from "react";
import { CenterAnnouncements, CenterFaq } from "@/features/ecency-center/sections";

export function CenterContent() {
  const [current, setCurrent] = useState("chats");

  const tabs = useMemo(
    () => [
      {
        title: "Conversations",
        key: "chats"
      },
      {
        title: "FAQ",
        key: "faq"
      },
      {
        title: "News",
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
