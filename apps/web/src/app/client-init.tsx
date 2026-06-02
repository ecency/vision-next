"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useGlobalStore } from "@/core/global-store";
import { useQuery } from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { initI18next, detectBrowserLang } from "@/features/i18n";
import * as ls from "@/utils/local-storage";
import Cookies from "js-cookie";
import { ConfigManager } from "@ecency/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useMount } from "react-use";
import { installConsoleRecorder } from "@/utils/console-msg";
import { setProxyBase } from "@ecency/render-helper";
import { ALLOWED_IMAGE_SERVERS } from "@/defaults";
// Side-effect import: attaches a global beforeinstallprompt listener as early
// as possible in client bootstrap so the event is captured even if the user
// lands on a page without an install CTA and navigates elsewhere later.
import "@/features/pwa-install";

export function ClientInit() {
  const { activeUser } = useActiveAccount();
  const setActiveUser = useGlobalStore((state) => state.setActiveUser);
  const initKeychain = useGlobalStore((state) => state.initKeychain);
  const loadUsers = useGlobalStore((state) => state.loadUsers);
  const setCurrency = useGlobalStore((state) => state.setCurrency);
  const currency = useGlobalStore((state) => state.currency);
  const setLang = useGlobalStore((state) => state.setLang);

  const queryClient = useQueryClient();

  // Prefetch account data for active user
  useQuery(getAccountFullQueryOptions(activeUser?.username));

  useMount(() => {
    installConsoleRecorder();

    ConfigManager.setQueryClient(queryClient as any);

    initKeychain();
    // Initialize i18n, then auto-detect the visitor's locale on their first
    // visit (no saved preference). This runs post-mount, so the initial render
    // still matches the server's en-US output — no hydration mismatch. The
    // detected language persists via setLang and is overridable from settings.
    initI18next().then(() => {
      const savedLang = ls.get("lang") || ls.get("current-language");
      if (!savedLang) {
        const detected = detectBrowserLang();
        if (detected && detected !== "en-US") {
          setLang(detected);
        }
      }
    });
    loadUsers();

    const activeUsername = ls.get("active_user") ?? Cookies.get("active_user");
    if (activeUsername) {
      setActiveUser(activeUsername);
    }

    // Apply stored image proxy preference (validated against whitelist)
    const storedImageProxy = ls.get("image_proxy");
    if (storedImageProxy && ALLOWED_IMAGE_SERVERS.includes(storedImageProxy)) {
      setProxyBase(storedImageProxy);
    }

    // Ensure currency is loaded from localStorage on client-side
    // This is needed because during SSR, localStorage returns null
    const storedCurrency = ls.get("currency");
    if (storedCurrency && typeof storedCurrency === "string" && storedCurrency !== currency) {
      // Update currency from localStorage if it differs from SSR default
      setCurrency(storedCurrency);
    }
  });

  return <></>;
}
