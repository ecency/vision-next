"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const DesktopChats = dynamic(() => import("./chats-page-client").then((mod) => mod.ChatsPageClient), {
  ssr: false
});

const MobileChats = dynamic(() => import("./chats-client").then((mod) => mod.ChatsClient), {
  ssr: false
});

const DESKTOP_QUERY = "(min-width: 768px)";

export function ChatsResponsive() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const query = window.matchMedia(DESKTOP_QUERY);
    const updateMatches = (event: MediaQueryListEvent | MediaQueryList) => setIsDesktop(event.matches);

    updateMatches(query);

    const listener = (event: MediaQueryListEvent) => updateMatches(event);

    if (query.addEventListener) {
      query.addEventListener("change", listener);
    } else {
      query.addListener(listener);
    }

    return () => {
      if (query.removeEventListener) {
        query.removeEventListener("change", listener);
      } else {
        query.removeListener(listener);
      }
    };
  }, []);

  if (isDesktop === null) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-[--text-muted]">
        Loading chats…
      </div>
    );
  }

  return isDesktop ? <DesktopChats /> : <MobileChats />;
}

