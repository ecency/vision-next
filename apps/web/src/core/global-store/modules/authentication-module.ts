import { ActiveUser } from "@/entities";
import * as ls from "@/utils/local-storage";
import Cookies from "js-cookie";
import { activeUserMaker } from "@/specs/test-helper";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import * as Sentry from "@sentry/nextjs";

const load = (): ActiveUser | null => {
  const name = ls.get("active_user");
  if (name && ls.get(`user_${name}`)) {
    return activeUserMaker(name);
  }

  return null;
};

export function createAuthenticationState() {
  return {
    activeUser: null as ActiveUser | null
  };
}

export type AuthenticationState = ReturnType<typeof createAuthenticationState>;

export const createAuthenticationActions = (
  set: (state: Partial<AuthenticationState>) => void,
  getState: () => AuthenticationState
) => ({
  setActiveUser: (name: string | null) => {
    if (name) {
      ls.set("active_user", name);
      Cookies.set(ACTIVE_USER_COOKIE_NAME, name, { expires: 365 });
      set({ activeUser: load() });

      Sentry.setUser({
        username: name
      });
    } else {
      ls.remove("active_user");
      Cookies.remove(ACTIVE_USER_COOKIE_NAME);
      set({ activeUser: load() });
      Sentry.setUser(null);
    }
  }
});
