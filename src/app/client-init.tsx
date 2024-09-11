import { useGlobalStore } from "@/core/global-store";
import useMount from "react-use/lib/useMount";
import * as ls from "@/utils/local-storage";
import Cookies from "js-cookie";
import { initI18next } from "@/features/i18n";
import { getAccountFullQuery } from "@/api/queries";
import { useEffect } from "react";

export function ClientInit() {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const setActiveUser = useGlobalStore((state) => state.setActiveUser);
  const updateActiveUser = useGlobalStore((state) => state.updateActiveUser);

  const { data } = getAccountFullQuery(activeUser?.username).useClientQuery();

  useMount(() => {
    initI18next();

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
