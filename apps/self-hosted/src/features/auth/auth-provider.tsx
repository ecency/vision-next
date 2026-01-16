'use client';

import type { Operation } from '@hiveio/dhive';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { InstanceConfigManager } from '@/core';
import type { AuthContextValue, AuthMethod, AuthUser, HiveAuthSession } from './types';
import {
  clearHiveAuthSession,
  clearUser,
  getHiveAuthSession,
  getUser,
  saveHiveAuthSession,
  saveUser,
} from './storage';
import { broadcast as keychainBroadcast, loginWithKeychain } from './utils/keychain';
import {
  broadcastWithHivesigner,
  getHivesignerLoginUrl,
  isHivesignerCallback,
  parseHivesignerCallback,
} from './utils/hivesigner';
import { broadcastWithHiveAuth, loginWithHiveAuth } from './utils/hive-auth';

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hiveAuthSession, setHiveAuthSession] = useState<HiveAuthSession | null>(null);
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
    return !!user && user.username.toLowerCase() === blogOwner.toLowerCase();
  }, [user, blogOwner]);

  // Load session from localStorage on mount
  useEffect(() => {
    const storedUser = getUser();
    const storedHiveAuth = getHiveAuthSession();

    if (storedUser) {
      setUser(storedUser);
    }
    if (storedHiveAuth) {
      setHiveAuthSession(storedHiveAuth);
    }

    setIsLoading(false);
  }, []);

  // Handle Hivesigner callback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const search = window.location.search;
    if (isHivesignerCallback(search)) {
      const callbackData = parseHivesignerCallback(search);
      if (callbackData) {
        const newUser: AuthUser = {
          username: callbackData.username,
          accessToken: callbackData.accessToken,
          loginType: 'hivesigner',
          expiresAt: Date.now() + callbackData.expiresIn * 1000,
        };
        setUser(newUser);
        saveUser(newUser);

        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Login function
  const login = useCallback(
    async (method: AuthMethod, username: string) => {
      setIsLoading(true);

      try {
        switch (method) {
          case 'keychain': {
            await loginWithKeychain(username);
            const newUser: AuthUser = {
              username,
              loginType: 'keychain',
            };
            setUser(newUser);
            saveUser(newUser);
            break;
          }

          case 'hiveauth': {
            await loginWithHiveAuth(username, {
              onQRCode: (qrData) => {
                // QR code data is handled by the login component
                window.dispatchEvent(
                  new CustomEvent('hiveauth:qrcode', { detail: qrData })
                );
              },
              onWaiting: () => {
                window.dispatchEvent(new CustomEvent('hiveauth:waiting'));
              },
              onSuccess: (session) => {
                const newUser: AuthUser = {
                  username,
                  loginType: 'hiveauth',
                  expiresAt: session.expire * 1000,
                };
                setUser(newUser);
                saveUser(newUser);
                setHiveAuthSession(session);
                saveHiveAuthSession(session);
              },
              onError: (error) => {
                window.dispatchEvent(
                  new CustomEvent('hiveauth:error', { detail: error })
                );
              },
            });
            break;
          }

          case 'hivesigner': {
            // Redirect will handle the rest
            break;
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Redirect to Hivesigner for login
  const loginWithHivesignerFn = useCallback(() => {
    const redirectUri = window.location.origin + window.location.pathname;
    const loginUrl = getHivesignerLoginUrl(redirectUri);
    window.location.href = loginUrl;
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    setHiveAuthSession(null);
    clearUser();
    clearHiveAuthSession();
  }, []);

  // Broadcast operations
  const broadcast = useCallback(
    async (operations: Operation[]): Promise<unknown> => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      switch (user.loginType) {
        case 'keychain':
          return keychainBroadcast(user.username, operations);

        case 'hivesigner':
          if (!user.accessToken) {
            throw new Error('No access token available');
          }
          return broadcastWithHivesigner(user.accessToken, operations);

        case 'hiveauth':
          if (!hiveAuthSession) {
            throw new Error('No HiveAuth session available');
          }
          return broadcastWithHiveAuth(hiveAuthSession, operations);

        default:
          throw new Error('Unknown login type');
      }
    },
    [user, hiveAuthSession]
  );

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isAuthEnabled,
      availableMethods,
      isBlogOwner,
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
      login,
      loginWithHivesignerFn,
      logout,
      broadcast,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
