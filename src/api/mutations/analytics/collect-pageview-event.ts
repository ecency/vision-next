"use client";

import { useMutation } from "@tanstack/react-query";
import { appAxios } from "@/api/axios";

const simpleCache = new Map<string, boolean>();

export function useCollectPageViewEvent(path: string) {
  return useMutation({
    mutationKey: ["collectPageViewEvent", path],
    mutationFn: async () => {
      if (simpleCache.has(path)) {
        return;
      }

      simpleCache.set(path, true);

      return appAxios.post("https://pl.ecency.com/api/event", {
        name: "pageview",
        url: `https://ecency.com/${path}`,
        domain: "ecency.com"
      });
    }
  });
}
