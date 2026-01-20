'use client';

import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth, useIsAuthenticated, useIsAuthEnabled, useAvailableAuthMethods } from '@/features/auth';
import { KeychainLogin } from '@/features/auth/components/keychain-login';
import { HiveAuthLogin } from '@/features/auth/components/hiveauth-login';
import { HivesignerLogin } from '@/features/auth/components/hivesigner-login';
import { InstanceConfigManager } from '@/core';

/**
 * Validates that a redirect URL is safe (internal path only).
 * Prevents open redirect vulnerabilities by only allowing:
 * - Relative paths starting with a single '/'
 * - Not starting with '//' (protocol-relative URLs)
 * - Not containing URL schemes like 'http:', 'javascript:', etc.
 */
function sanitizeRedirect(redirect: string | undefined): string {
  if (!redirect || typeof redirect !== 'string') {
    return '/';
  }

  const trimmed = redirect.trim();

  // Must start with exactly one '/' and not be a protocol-relative URL
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '/';
  }

  // Check for URL schemes (http:, https:, javascript:, data:, etc.)
  if (/^\/[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(trimmed)) {
    return '/';
  }

  // Block encoded characters that could bypass the checks
  if (trimmed.includes('%2f') || trimmed.includes('%2F') || trimmed.includes('%5c') || trimmed.includes('%5C')) {
    return '/';
  }

  return trimmed;
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: sanitizeRedirect(search.redirect as string),
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: '/login' });
  const isAuthenticated = useIsAuthenticated();
  const isAuthEnabled = useIsAuthEnabled();
  const availableMethods = useAvailableAuthMethods();
  const [error, setError] = useState<string | null>(null);

  const blogTitle = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.meta.title
  );

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: redirect || '/' });
    }
  }, [isAuthenticated, navigate, redirect]);

  // Redirect if auth is disabled
  useEffect(() => {
    if (!isAuthEnabled) {
      navigate({ to: '/' });
    }
  }, [isAuthEnabled, navigate]);

  const handleSuccess = () => {
    setError(null);
    navigate({ to: redirect || '/' });
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!isAuthEnabled) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-theme-primary">
      <div className="w-full max-w-md">
        <div className="card-theme p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold heading-theme mb-2">Login to {blogTitle}</h1>
            <p className="text-theme-muted font-theme-ui">Choose your preferred login method</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-theme-ui">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {availableMethods.includes('keychain') && (
              <KeychainLogin onSuccess={handleSuccess} onError={handleError} />
            )}
            {availableMethods.includes('hivesigner') && <HivesignerLogin />}
            {availableMethods.includes('hiveauth') && (
              <HiveAuthLogin onSuccess={handleSuccess} onError={handleError} />
            )}
          </div>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => navigate({ to: '/' })}
              className="text-sm text-theme-muted hover:text-theme-primary transition-theme font-theme-ui"
            >
              Back to blog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
