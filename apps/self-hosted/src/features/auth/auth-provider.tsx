"use client";

import type { Operation } from "@hiveio/dhive";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { InstanceConfigManager } from "@/core";
import type {
  AuthContextValue,
  AuthMethod,
  AuthUser,
  HiveAuthSession,
} from "./types";
import {
  clearHiveAuthSession,
  clearUser,
  getHiveAuthSession,
  getUser,
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
  isHivesignerCallback,
  parseHivesignerCallback,
} from "./utils/hivesigner";
import { broadcastWithHiveAuth, loginWithHiveAuth } from "./utils/hive-auth";
import { useAuthStore } from "@/store";

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, setUser, session, setSession } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Get auth config
  const authConfig = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.features.auth
  );

  const isAuthEnabled = authConfig?.enabled ?? false;
  const availableMethods = (authConfig?.methods ?? []) as AuthMethod[];

  // Get blog owner username
  const blogOwner = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.username
  );

  // Check if current user is blog owner
  const isBlogOwner = useMemo(() => {
    if (!user || !blogOwner) return false;
    return (
      (user.username ?? "").toLowerCase() === (blogOwner ?? "").toLowerCase()
    );
  }, [user, blogOwner]);

  // Load session from localStorage on mount
  useEffect(() => {
    const storedUser = getUser();
    const storedHiveAuth = getHiveAuthSession();

    if (storedUser) {
      // Check if token has expired
      if (storedUser.expiresAt && Date.now() > storedUser.expiresAt) {
        // Token expired, clear session
        clearUser();
        clearHiveAuthSession();
      } else {
        setUser(storedUser);
      }
    }
    if (storedHiveAuth) {
      // Check if HiveAuth session has expired
      if (Date.now() > storedHiveAuth.expire * 1000) {
        clearHiveAuthSession();
      } else {
        setSession(storedHiveAuth);
      }
    }

    setIsLoading(false);
  }, []);

  // Periodically check token expiry and auto-logout if expired
  useEffect(() => {
    if (!user?.expiresAt) return;

    const checkExpiry = () => {
      if (user.expiresAt && Date.now() > user.expiresAt) {
        // Token expired, logout
        setUser(undefined);
        setSession(undefined);
        clearUser();
        clearHiveAuthSession();
      }
    };

    // Check every minute
    const interval = setInterval(checkExpiry, 60 * 1000);

    // Also check immediately
    checkExpiry();

    return () => clearInterval(interval);
  }, [user?.expiresAt]);

  // Handle Hivesigner callback
  useEffect(() => {
    if (typeof window === "undefined") return;

    const search = window.location.search;
    if (isHivesignerCallback(search)) {
      const callbackData = parseHivesignerCallback(search);
      if (callbackData) {
        const newUser: AuthUser = {
          username: callbackData.username,
          accessToken: callbackData.accessToken,
          loginType: "hivesigner",
          expiresAt: Date.now() + callbackData.expiresIn * 1000,
        };
        setUser(newUser);
        saveUser(newUser);

        // Clean up URL
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  // Login function
  const login = useCallback(async (method: AuthMethod, username: string) => {
    setIsLoading(true);

    try {
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
              // QR code data is handled by the login component
              window.dispatchEvent(
                new CustomEvent("hiveauth:qrcode", { detail: qrData })
              );
            },
            onWaiting: () => {
              window.dispatchEvent(new CustomEvent("hiveauth:waiting"));
            },
            onSuccess: (session) => {
              const newUser: AuthUser = {
                username,
                loginType: "hiveauth",
                expiresAt: session.expire * 1000,
              };
              setUser(newUser);
              saveUser(newUser);
              setSession(session);
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

        case "hivesigner": {
          // Redirect will handle the rest
          break;
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Redirect to Hivesigner for login
  const loginWithHivesignerFn = useCallback(() => {
    const redirectUri = window.location.origin + window.location.pathname;
    const loginUrl = getHivesignerLoginUrl(redirectUri);
    window.location.href = loginUrl;
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setUser(undefined);
    setSession(undefined);
    clearUser();
    clearHiveAuthSession();
  }, []);

  // Broadcast operations
  const broadcast = useCallback(
    async (operations: Operation[]): Promise<unknown> => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      switch (user.loginType) {
        case "keychain":
          return keychainBroadcast(user.username, operations);

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
    },
    [user, session]
  );

  // Check if session is expiring within 5 minutes
  const isSessionExpiringSoon = useMemo(() => {
    if (!user?.expiresAt) return false;
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
    return user.expiresAt < fiveMinutesFromNow;
  }, [user?.expiresAt]);

  const value: AuthContextValue = useMemo(
    () => ({
      user: user!,
      isAuthenticated: !!user,
      isLoading,
      isAuthEnabled,
      availableMethods,
      isBlogOwner,
      isSessionExpiringSoon,
      login,
      loginWithHivesigner: loginWithHivesignerFn,
      logout,
      broadcast,
    }),
    [
      user,
      isLoading,
      isAuthEnabled,
      availableMethods,
      isBlogOwner,
      isSessionExpiringSoon,
      login,
      loginWithHivesignerFn,
      logout,
      broadcast,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
