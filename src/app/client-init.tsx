import { client } from "@/api/hive";
import { getAccountFullQuery } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { initI18next } from "@/features/i18n";
import * as ls from "@/utils/local-storage";
import Cookies from "js-cookie";
import { useEffect } from "react";
import useMount from "react-use/lib/useMount";

export function ClientInit() {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const setActiveUser = useGlobalStore((state) => state.setActiveUser);
  const updateActiveUser = useGlobalStore((state) => state.updateActiveUser);
  const initKeychain = useGlobalStore((state) => state.initKeychain);
  const loadUsers = useGlobalStore((state) => state.loadUsers);

  const { data } = getAccountFullQuery(activeUser?.username).useClientQuery();

  useMount(() => {
    initKeychain();
    initI18next();
    loadUsers();

    (window as any).dHiveClient = client;

    const activeUsername = ls.get("active_user") ?? Cookies.get("active_user");
    if (activeUsername) {
      setActiveUser(activeUsername);
    }
  });

  useEffect(() => {
    if (data) {
      updateActiveUser(data);
    }
  }, [data, updateActiveUser]);

  return <></>;
}
