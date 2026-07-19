import { Account, ActiveUser } from "@/entities";
import * as ls from "@/utils/local-storage";
import Cookies from "js-cookie";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { sentry } from "@/core/sentry/lazy-sentry";

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
  // `set` merges into the combined global store, so this action can also clear
  // cross-module state (the in-memory signing key) on every active-user change.
  set: (state: Partial<AuthenticationState & { signingKey: string | null }>) => void,
  getState: () => AuthenticationState
) => ({
  setActiveUser: (name: string | null) => {
    const currentUsername = getState().activeUser?.username;

    if (name === currentUsername) {
      return;
    }

    const nextActiveUser = name ? load(name) : null;

    if (name) {
      ls.set("active_user", name);
      Cookies.set(ACTIVE_USER_COOKIE_NAME, name, { expires: 365 });
      // Clear any previous account's signing key so it can never pre-fill or be
      // reused under the newly activated account. Login sets the key AFTER
      // activating the user, so this does not wipe a fresh login's key.
      set({ activeUser: nextActiveUser, signingKey: null });

      sentry.setUser({
        username: name
      });
    } else {
      ls.remove("active_user");
      Cookies.remove(ACTIVE_USER_COOKIE_NAME);
      // Logout: drop the in-memory signing key alongside the active user.
      set({ activeUser: nextActiveUser, signingKey: null });
      sentry.setUser(null);
    }
  }
});
