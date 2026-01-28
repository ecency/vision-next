import { Account, ActiveUser } from "@/entities";
import * as ls from "@/utils/local-storage";
import Cookies from "js-cookie";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import * as Sentry from "@sentry/nextjs";
import { setSessionCookie } from "@/app/actions/set-session";

const makeActiveUser = (username: string): ActiveUser => ({
  username,
  data: {
    name: username
  } as Account
});

const load = (name?: string | null): ActiveUser | null => {
  const username = name ?? ls.get("active_user");

  if (username && ls.get(`user_${username}`)) {
    return makeActiveUser(username);
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
  setActiveUser: async (name: string | null) => {
    const currentUsername = getState().activeUser?.username;

    if (name === currentUsername) {
      return;
    }

    const nextActiveUser = name ? load(name) : null;

    if (name) {
      ls.set("active_user", name);
      // Keep client-side cookie for backward compatibility (NOT trusted for auth)
      Cookies.set(ACTIVE_USER_COOKIE_NAME, name, { expires: 365 });
      set({ activeUser: nextActiveUser });

      Sentry.setUser({
        username: name
      });

      // IMPORTANT: Set server-side signed session cookie
      // This is the cryptographically verified session used for authorization
      try {
        await setSessionCookie(name);
      } catch (error) {
        console.error("Failed to set server-side session cookie:", error);
        // Continue anyway - client-side session is set
        // Server-side operations will fail but client still works
      }
    } else {
      ls.remove("active_user");
      Cookies.remove(ACTIVE_USER_COOKIE_NAME);
      set({ activeUser: nextActiveUser });
      Sentry.setUser(null);

      // Clear server-side session
      try {
        await setSessionCookie(null);
      } catch (error) {
        console.error("Failed to clear server-side session cookie:", error);
      }
    }
  }
});
