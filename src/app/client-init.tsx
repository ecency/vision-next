import { useGlobalStore } from "@/core/global-store";
import useMount from "react-use/lib/useMount";
import * as ls from "@/utils/local-storage";
import Cookies from "js-cookie";
import { initI18next } from "@/features/i18n";
import Bugsnag from "@bugsnag/js";

export function ClientInit() {
  const setActiveUser = useGlobalStore((state) => state.setActiveUser);
  const updateActiveUser = useGlobalStore((state) => state.updateActiveUser);

  useMount(() => {
    initI18next();

    const activeUsername = ls.get("active_user") ?? Cookies.get("active_user");
    if (activeUsername) {
      setActiveUser(activeUsername);
      updateActiveUser();
    }

    Bugsnag.setUser(activeUsername);
  });

  return <></>;
}
