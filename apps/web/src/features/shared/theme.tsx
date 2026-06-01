"use client";

import { useEffect } from "react";
import { useGlobalStore } from "@/core/global-store";

export function Theme() {
  const theme = useGlobalStore((state) => state.theme);

  useEffect(() => {
    if (["day", "night"].includes(theme)) {
      if (theme === "day") {
        document.body.classList.remove("dark");
      } else {
        document.body.classList.add("dark");
      }
    }
  }, [theme]);

  return <></>;
}
