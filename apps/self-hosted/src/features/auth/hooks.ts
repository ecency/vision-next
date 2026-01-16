import { useContext } from 'react';
import { AuthContext } from './auth-provider';
import type { AuthContextValue } from './types';

/**
 * Get the full auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Check if auth is enabled
 */
export function useIsAuthEnabled(): boolean {
  const { isAuthEnabled } = useAuth();
  return isAuthEnabled;
}

/**
 * Check if current user is the blog owner
 */
export function useIsBlogOwner(): boolean {
  const { isBlogOwner } = useAuth();
  return isBlogOwner;
}

/**
 * Get the current user
 */
export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}

/**
 * Get broadcast function
 */
export function useBroadcast() {
  const { broadcast } = useAuth();
  return broadcast;
}

/**
 * Get available auth methods
 */
export function useAvailableAuthMethods() {
  const { availableMethods } = useAuth();
  return availableMethods;
}
