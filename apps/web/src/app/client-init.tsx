"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useGlobalStore } from "@/core/global-store";
import { useQuery } from "@tanstack/react-query";
import { CONFIG, getAccountFullQueryOptions } from "@ecency/sdk";
import { initI18next } from "@/features/i18n";
import * as ls from "@/utils/local-storage";
import Cookies from "js-cookie";
import { ConfigManager } from "@ecency/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useMount } from "react-use";
import { installConsoleRecorder } from "@/utils/console-msg";
import { registerWalletHiveAuthBroadcast } from "@ecency/wallets";
import { broadcastWithHiveAuth } from "@/utils/hive-auth";

export function ClientInit() {
  const { activeUser } = useActiveAccount();
  const setActiveUser = useGlobalStore((state) => state.setActiveUser);
  const initKeychain = useGlobalStore((state) => state.initKeychain);
  const loadUsers = useGlobalStore((state) => state.loadUsers);
  const setCurrency = useGlobalStore((state) => state.setCurrency);
  const currency = useGlobalStore((state) => state.currency);

  const queryClient = useQueryClient();

  // Prefetch account data for active user
  useQuery(getAccountFullQueryOptions(activeUser?.username));

  useMount(() => {
    installConsoleRecorder();

    ConfigManager.setQueryClient(queryClient as any);

    initKeychain();
    initI18next();
    loadUsers();

    registerWalletHiveAuthBroadcast((username, operations, keyType) =>
      broadcastWithHiveAuth(username, operations, keyType)
    );

    (window as any).dHiveClient = CONFIG.hiveClient;

    const activeUsername = ls.get("active_user") ?? Cookies.get("active_user");
    if (activeUsername) {
      setActiveUser(activeUsername);
    }

    // Ensure currency is loaded from localStorage on client-side
    // This is needed because during SSR, localStorage returns null
    const storedCurrency = ls.get("currency");
    if (storedCurrency && typeof storedCurrency === "string" && storedCurrency !== currency) {
      // Update currency from localStorage if it differs from SSR default
      setCurrency(storedCurrency);
    }

    // Clear old wallet queries cache (migration from queries without currency parameter)
    // This ensures production cache doesn't have stale data with old query keys
    const WALLET_CACHE_VERSION = "v2-with-currency";
    const currentCacheVersion = ls.get("wallet_cache_version");
    if (currentCacheVersion !== WALLET_CACHE_VERSION) {
      queryClient.removeQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key) || key.length < 2) return false;
          // Remove old portfolio, asset-info, list, and token-operations queries
          return (
            (key[0] === "ecency-wallets" &&
              (key[1] === "portfolio" || key[1] === "asset-info" || key[1] === "list")) ||
            (key[0] === "wallets" && key[1] === "token-operations")
          );
        },
      });
      ls.set("wallet_cache_version", WALLET_CACHE_VERSION);
    }
  });

  return <></>;
}
