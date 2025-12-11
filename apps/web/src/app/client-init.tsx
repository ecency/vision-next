"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { getAccountFullQuery } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { initI18next } from "@/features/i18n";
import * as ls from "@/utils/local-storage";
import Cookies from "js-cookie";
import { client } from "@/api/hive";
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

  const queryClient = useQueryClient();

  // Prefetch account data for active user
  getAccountFullQuery(activeUser?.username).useClientQuery();

  useMount(() => {
    installConsoleRecorder();

    ConfigManager.setQueryClient(queryClient as any);

    initKeychain();
    initI18next();
    loadUsers();

    registerWalletHiveAuthBroadcast((username, operations, keyType) =>
      broadcastWithHiveAuth(username, operations, keyType)
    );

    (window as any).dHiveClient = client;

    const activeUsername = ls.get("active_user") ?? Cookies.get("active_user");
    if (activeUsername) {
      setActiveUser(activeUsername);
    }
  });

  return <></>;
}
