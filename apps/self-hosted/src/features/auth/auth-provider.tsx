"use client";

import { InstanceConfigManager } from "@/core";
import { useAuthStore } from "@/store";
import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearHiveAuthSession, clearUser, saveUser } from "./storage";
import type { AuthContextValue, AuthMethod, AuthUser } from "./types";
import {
  isHivesignerCallback,
  parseHivesignerCallback,
} from "./utils/hivesigner";

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, setUser, setSession } = useAuthStore();

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

  // Check if session is expiring within 5 minutes
  const isSessionExpiringSoon = useMemo(() => {
    if (!user?.expiresAt) return false;
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
    return user.expiresAt < fiveMinutesFromNow;
  }, [user?.expiresAt]);

  const value: AuthContextValue = useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isAuthEnabled,
      availableMethods,
      isBlogOwner,
      isSessionExpiringSoon,
    }),
    [user, isAuthEnabled, availableMethods, isBlogOwner, isSessionExpiringSoon]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
