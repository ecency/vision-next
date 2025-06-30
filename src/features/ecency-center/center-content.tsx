import { CenterTabs } from "@/features/ecency-center/center-tabs";
import { useMemo, useState } from "react";
import { CenterAnnouncements, CenterFaq } from "@/features/ecency-center/sections";
import { ChatPopUp } from "@/app/chats/_components/chat-popup";
import i18next from "i18next";
import { usePathname } from "next/navigation";

export function CenterContent() {
  const [current, setCurrent] = useState("chats");
  const pathname = usePathname();

  const tabs = useMemo(
    () => [
      {
        title: i18next.t("center.chats"),
        key: "chats"
      },
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
      {current === "chats" &&
        (pathname?.startsWith("/chats") ? (
          <div className="h-[480px] w-full flex p-4 items-center justify-center opacity-50 text-sm font-semibold">
            {i18next.t("center.chats-page-placeholder")}
          </div>
        ) : (
          <ChatPopUp />
        ))}
    </div>
  );
}
