"use client";

import type { Operation } from "@hiveio/dhive";
import { authenticationStore } from "@/store";
import type { AuthMethod, AuthUser } from "./types";
import {
  clearHiveAuthSession,
  clearUser,
  saveHiveAuthSession,
  saveUser,
} from "./storage";
import {
  broadcast as keychainBroadcast,
  loginWithKeychain,
} from "./utils/keychain";
import {
  broadcastWithHivesigner,
  getHivesignerLoginUrl,
} from "./utils/hivesigner";
import { broadcastWithHiveAuth, loginWithHiveAuth } from "./utils/hive-auth";

/**
 * Login with the given method and username.
 * Updates store and storage; callers should handle loading state.
 */
export async function login(method: AuthMethod, username: string): Promise<void> {
  const { setUser, setSession } = authenticationStore.getState();

  switch (method) {
    case "keychain": {
      await loginWithKeychain(username);
      const newUser: AuthUser = {
        username,
        loginType: "keychain",
      };
      setUser(newUser);
      saveUser(newUser);
      break;
    }

    case "hiveauth": {
      await loginWithHiveAuth(username, {
        onQRCode: (qrData) => {
          window.dispatchEvent(
            new CustomEvent("hiveauth:qrcode", { detail: qrData })
          );
        },
        onWaiting: () => {
          window.dispatchEvent(new CustomEvent("hiveauth:waiting"));
        },
        onSuccess: (session) => {
          const { setUser: setUserState, setSession: setSessionState } =
            authenticationStore.getState();
          const newUser: AuthUser = {
            username,
            loginType: "hiveauth",
            expiresAt: session.expire * 1000,
          };
          setUserState(newUser);
          saveUser(newUser);
          setSessionState(session);
          saveHiveAuthSession(session);
        },
        onError: (error) => {
          window.dispatchEvent(
            new CustomEvent("hiveauth:error", { detail: error })
          );
        },
      });
      break;
    }

    case "hivesigner":
      // Redirect handles the rest
      break;
  }
}

/**
 * Redirect to Hivesigner for login.
 */
export function loginWithHivesigner(): void {
  if (typeof window === "undefined") return;
  const redirectUri = window.location.origin + window.location.pathname;
  const loginUrl = getHivesignerLoginUrl(redirectUri);
  window.location.href = loginUrl;
}

/**
 * Log out the current user and clear store and storage.
 */
export function logout(): void {
  const { setUser, setSession } = authenticationStore.getState();
  setUser(undefined);
  setSession(undefined);
  clearUser();
  clearHiveAuthSession();
}

export type BroadcastAuthorityType = "Active" | "Posting" | "Owner" | "Memo";

/**
 * Broadcast operations using the current user's auth method.
 * Throws if not authenticated or session/keychain is missing.
 * @param authorityType - For keychain: which key to use (e.g. "Active" for transfers).
 */
export async function broadcast(
  operations: Operation[],
  options?: { authorityType?: BroadcastAuthorityType }
): Promise<unknown> {
  const { user, session } = authenticationStore.getState();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const authorityType = options?.authorityType ?? "Posting";

  switch (user.loginType) {
    case "keychain":
      return keychainBroadcast(user.username, operations, authorityType);

    case "hivesigner":
      if (!user.accessToken) {
        throw new Error("No access token available");
      }
      return broadcastWithHivesigner(user.accessToken, operations);

    case "hiveauth":
      if (!session) {
        throw new Error("No HiveAuth session available");
      }
      return broadcastWithHiveAuth(session, operations);

    default:
      throw new Error("Unknown login type");
  }
}
